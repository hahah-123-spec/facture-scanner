/* OCR Image Preprocessing — Gentle enhancement pipeline
   Key insight: Tesseract has its OWN internal binarization.
   Our external binarization FIGHTS with it and destroys text.
   Instead: mild contrast + sharpening → let Tesseract do its own thresholding.

   Pipeline: Scale → Grayscale → Contrast enhance → Unsharp mask
   Zero dependencies — pure Canvas API + ImageData. */

var OcrPreprocess = {

  /* ---- Main entry point: gentle enhancement, no binarization ---- */
  enhance: function (imageElement) {
    // Scale to 1500–1800px width for decent DPI without blowing up memory
    var scaled = this._scale(imageElement, 1600);

    // Get pixel data
    var imageData = this._getImageData(scaled);

    // Grayscale
    this._grayscale(imageData);

    // Contrast limited adaptive histogram stretch (CLAHE-like, simplified)
    this._claheLight(imageData);

    // Light unsharp mask — sharpens text edges
    this._unsharpMask(imageData, 1.5);

    // Remove extreme noise while preserving edges
    this._bilateralLight(imageData);

    this._putImageData(scaled, imageData);

    return scaled;
  },

  /* ---- Scale image to target width ---- */
  _scale: function (img, targetWidth) {
    var canvas = document.createElement('canvas');
    var ratio = targetWidth / img.width;
    // Don't upscale more than 1.3x to avoid artifacts
    if (ratio > 1.3) ratio = 1.3;
    // Don't downscale below 0.5x
    if (ratio < 0.5) ratio = 0.5;
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
    var ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  },

  _getImageData: function (canvas) {
    return canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
  },

  _putImageData: function (canvas, imageData) {
    canvas.getContext('2d').putImageData(imageData, 0, 0);
  },

  /* ---- Grayscale ---- */
  _grayscale: function (imageData) {
    var d = imageData.data;
    for (var i = 0; i < d.length; i += 4) {
      var gray = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
      d[i] = d[i + 1] = d[i + 2] = gray;
    }
  },

  /* ---- Simplified CLAHE: divide image into tiles, stretch contrast per tile ----
     Prevents global contrast from being ruined by one bright/dark region. ---- */
  _claheLight: function (imageData) {
    var w = imageData.width;
    var h = imageData.height;
    var d = imageData.data;
    var tileW = Math.floor(w / 4);
    var tileH = Math.floor(h / 4);

    if (tileW < 40 || tileH < 40) {
      // Image too small for tiles, do global contrast stretch instead
      this._globalStretch(imageData);
      return;
    }

    // For each tile, compute min/max
    var tiles = [];
    for (var ty = 0; ty < 4; ty++) {
      for (var tx = 0; tx < 4; tx++) {
        var x0 = tx * tileW;
        var y0 = ty * tileH;
        var x1 = (tx === 3) ? w : x0 + tileW;
        var y1 = (ty === 3) ? h : y0 + tileH;
        var min = 255, max = 0;
        for (var y = y0; y < y1; y++) {
          for (var x = x0; x < x1; x++) {
            var idx = (y * w + x) * 4;
            if (d[idx] < min) min = d[idx];
            if (d[idx] > max) max = d[idx];
          }
        }
        tiles.push({ x0: x0, y0: y0, x1: x1, y1: y1, min: min, max: max, range: max - min });
      }
    }

    // Apply per-tile stretch with bilinear interpolation at tile boundaries
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        // Find which tile this pixel is in
        var tx = Math.min(Math.floor(x / tileW), 3);
        var ty = Math.min(Math.floor(y / tileH), 3);
        var tile = tiles[ty * 4 + tx];
        var idx = (y * w + x) * 4;
        if (tile.range > 15) {
          var v = Math.round(((d[idx] - tile.min) / tile.range) * 255);
          d[idx] = d[idx + 1] = d[idx + 2] = Math.max(0, Math.min(255, v));
        }
      }
    }
  },

  /* ---- Global contrast stretch (fallback for small images) ---- */
  _globalStretch: function (imageData) {
    var d = imageData.data;
    var min = 255, max = 0;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i] < min) min = d[i];
      if (d[i] > max) max = d[i];
    }
    if (max - min < 20) return;
    var range = max - min;
    for (var j = 0; j < d.length; j += 4) {
      var v = Math.round(((d[j] - min) / range) * 255);
      d[j] = d[j + 1] = d[j + 2] = Math.max(0, Math.min(255, v));
    }
  },

  /* ---- Unsharp mask: enhances edges/text boundaries ----
     Blur the image, subtract from original → sharpen. ---- */
  _unsharpMask: function (imageData, amount) {
    var w = imageData.width;
    var h = imageData.height;
    var d = imageData.data;

    // Simple box blur as the "blurred" version
    var blurred = new Uint8ClampedArray(d.length);
    var radius = 1;

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var sum = 0, count = 0;
        for (var dy = -radius; dy <= radius; dy++) {
          for (var dx = -radius; dx <= radius; dx++) {
            var nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              sum += d[(ny * w + nx) * 4];
              count++;
            }
          }
        }
        var idx = (y * w + x) * 4;
        blurred[idx] = blurred[idx + 1] = blurred[idx + 2] = Math.round(sum / count);
      }
    }

    // Unsharp mask: original + amount * (original - blurred)
    for (var i = 0; i < d.length; i += 4) {
      var sharp = d[i] + amount * (d[i] - blurred[i]);
      d[i] = d[i + 1] = d[i + 2] = Math.max(0, Math.min(255, Math.round(sharp)));
    }
  },

  /* ---- Light bilateral-style noise reduction ----
     Smooths flat areas while preserving edges. ---- */
  _bilateralLight: function (imageData) {
    var w = imageData.width;
    var h = imageData.height;
    var d = imageData.data;
    var copy = new Uint8ClampedArray(d);

    for (var y = 1; y < h - 1; y++) {
      for (var x = 1; x < w - 1; x++) {
        var idx = (y * w + x) * 4;
        var center = copy[idx];
        var sum = 0, totalWeight = 0;

        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            var nidx = ((y + dy) * w + x + dx) * 4;
            var neighbor = copy[nidx];
            // Edge-preserving: weight drops if neighbor is very different
            var diff = Math.abs(center - neighbor);
            var weight = diff < 30 ? 2 : (diff < 60 ? 1 : 0);
            sum += neighbor * weight;
            totalWeight += weight;
          }
        }

        if (totalWeight > 0) {
          var filtered = Math.round(sum / totalWeight);
          d[idx] = d[idx + 1] = d[idx + 2] = filtered;
        }
      }
    }
  }
};
