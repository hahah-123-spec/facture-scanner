/* OCR Image Preprocessing — Canvas-based pipeline
   Transforms raw phone photos into clean, high-contrast black-and-white
   images that Tesseract can actually read accurately.

   Pipeline: Scale → Grayscale → Contrast → Adaptive Threshold → Denoise
   Zero external dependencies — pure Canvas API + ImageData processing. */

var OcrPreprocess = {

  /* ---- Main entry point ---- */
  process: function (imageElement) {
    // Step 0: Scale image to optimal size for OCR (~1200px width)
    var scaled = this._scale(imageElement, 1200);

    // Step 1: Extract pixel data
    var imageData = this._getImageData(scaled);

    // Step 2: Grayscale
    this._grayscale(imageData);

    // Step 3: Contrast stretch (enhance text-background separation)
    this._contrastStretch(imageData);

    // Step 4: Adaptive threshold (Bradley-Roth — handles uneven lighting)
    this._adaptiveThreshold(imageData, Math.floor(imageData.width / 8), 12);

    // Step 5: Denoise — remove speckle noise
    this._denoise(imageData);

    // Step 6: Put processed pixels back onto canvas
    this._putImageData(scaled, imageData);

    return scaled; // returns canvas element with processed image
  },

  /* ---- Scale image to target width ---- */
  _scale: function (img, targetWidth) {
    var canvas = document.createElement('canvas');
    var ratio = targetWidth / img.width;
    if (ratio >= 1) {
      // Image is already small enough, don't upscale more than 1.5x
      ratio = Math.min(ratio, 1.5);
    }
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    var ctx = canvas.getContext('2d');
    // Use high-quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  },

  /* ---- Get ImageData from canvas ---- */
  _getImageData: function (canvas) {
    var ctx = canvas.getContext('2d');
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  },

  /* ---- Put ImageData back to canvas ---- */
  _putImageData: function (canvas, imageData) {
    var ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
  },

  /* ---- Grayscale conversion (luminance-preserving) ---- */
  _grayscale: function (imageData) {
    var d = imageData.data;
    for (var i = 0; i < d.length; i += 4) {
      // ITU-R BT.601 luminance (human perception weighted)
      var gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
  },

  /* ---- Contrast stretch (normalize histogram to full 0-255 range) ---- */
  _contrastStretch: function (imageData) {
    var d = imageData.data;
    var min = 255, max = 0;

    // Find min/max brightness
    for (var i = 0; i < d.length; i += 4) {
      if (d[i] < min) min = d[i];
      if (d[i] > max) max = d[i];
    }

    // Avoid division by zero or no-op
    if (max - min < 20) return;

    // Stretch to full range
    var range = max - min;
    for (var j = 0; j < d.length; j += 4) {
      var stretched = Math.round(((d[j] - min) / range) * 255);
      d[j] = d[j + 1] = d[j + 2] = Math.max(0, Math.min(255, stretched));
    }
  },

  /* ---- Bradley-Roth Adaptive Threshold ----
     For each pixel, compare it to the average of its surrounding window.
     If pixel is darker than avg * (1 - threshold/100) → black, else → white.
     Uses integral image for O(1) window sum lookup (very fast). ---- */
  _adaptiveThreshold: function (imageData, windowSize, threshold) {
    var w = imageData.width;
    var h = imageData.height;
    var d = imageData.data;
    var s = Math.max(windowSize, 10); // minimum window size
    var t = threshold / 100;          // e.g., 12 → 0.12

    // Build integral image (1D array, width+1 x height+1, 0-padded left/top)
    var integral = new Float64Array((w + 1) * (h + 1));
    // We only need grayscale, all R/G/B are same after _grayscale
    for (var y = 0; y < h; y++) {
      var rowSum = 0;
      var rowOffset = y * w * 4;
      var intRow = (y + 1) * (w + 1);
      var prevIntRow = y * (w + 1);
      for (var x = 0; x < w; x++) {
        rowSum += d[rowOffset + x * 4]; // pixel brightness (R=G=B after grayscale)
        integral[intRow + x + 1] = integral[prevIntRow + x + 1] + rowSum;
      }
    }

    // Apply threshold using integral image for fast window sums
    for (var y2 = 0; y2 < h; y2++) {
      var rowOffset2 = y2 * w * 4;
      var halfS = Math.floor(s / 2);

      var y1 = Math.max(0, y2 - halfS);
      var y2b = Math.min(h - 1, y2 + halfS);
      var countY = y2b - y1 + 1;

      for (var x2 = 0; x2 < w; x2++) {
        var x1 = Math.max(0, x2 - halfS);
        var x2b = Math.min(w - 1, x2 + halfS);
        var countX = x2b - x1 + 1;
        var area = countY * countX;

        // Get window sum via integral image (4 corners)
        var sum = integral[(y2b + 1) * (w + 1) + x2b + 1]
                - integral[(y1) * (w + 1) + x2b + 1]
                - integral[(y2b + 1) * (w + 1) + x1]
                + integral[(y1) * (w + 1) + x1];

        var avg = sum / area;
        var pixel = d[rowOffset2 + x2 * 4];

        // If pixel is darker than (avg - t%), it's text → black
        var val = (pixel < avg * (1 - t)) ? 0 : 255;
        d[rowOffset2 + x2 * 4] = val;
        d[rowOffset2 + x2 * 4 + 1] = val;
        d[rowOffset2 + x2 * 4 + 2] = val;
      }
    }
  },

  /* ---- Denoise: simple median-style speckle removal ----
     Removes isolated black/white pixels that don't match their neighbors.
     This cleans up salt-and-pepper noise from the threshold step. ---- */
  _denoise: function (imageData) {
    var w = imageData.width;
    var h = imageData.height;
    var d = imageData.data;
    var copy = new Uint8ClampedArray(d);

    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var idx = (y * w + x) * 4;
        var pixel = copy[idx]; // 0 or 255 after threshold

        // Count matching neighbors (8-connected)
        var same = 0;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            var nidx = ((y + dy) * w + x + dx) * 4;
            if (copy[nidx] === pixel) same++;
          }
        }

        // If fewer than 4 of 8 neighbors match, flip this pixel
        if (same < 4) {
          var flipped = pixel === 0 ? 255 : 0;
          d[idx] = flipped;
          d[idx + 1] = flipped;
          d[idx + 2] = flipped;
        }
      }
    }
  }
};
