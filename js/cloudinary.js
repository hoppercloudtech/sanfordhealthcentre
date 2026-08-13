/* ============================================================
   STANFORD HEALTH CENTRE — Cloudinary Upload Helper
   ------------------------------------------------------------
   1. Create a free account at https://cloudinary.com
   2. Copy your "Cloud name" from the dashboard, paste below.
   3. Go to Settings > Upload > Upload presets > Add upload preset
      - Set "Signing mode" to "Unsigned"
      - Save it, copy the preset name, paste below.
   This lets the admin dashboard upload images straight from the
   browser without exposing any secret keys.
   ============================================================ */

const CLOUDINARY_CLOUD_NAME = "YOUR_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "YOUR_UPLOAD_PRESET";

/**
 * Uploads a File object to Cloudinary and returns the resulting
 * secure image URL. Throws on failure.
 * @param {File} file
 * @param {(percent:number)=>void} [onProgress]
 * @returns {Promise<string>}
 */
function uploadToCloudinary(file, onProgress) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file selected."));
    if (CLOUDINARY_CLOUD_NAME === "YOUR_CLOUD_NAME") {
      return reject(new Error("Cloudinary is not configured yet. Edit js/cloudinary.js"));
    }

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) {
          resolve(res.secure_url);
        } else {
          reject(new Error(res.error?.message || "Upload failed."));
        }
      } catch (err) {
        reject(new Error("Unexpected response from Cloudinary."));
      }
    };

    xhr.onerror = () => reject(new Error("Network error while uploading image."));
    xhr.send(formData);
  });
}

/**
 * Resolves the final image URL for a record: if a raw link was typed
 * in, use it as-is; otherwise upload the chosen file to Cloudinary.
 * @param {{ linkInput: HTMLInputElement, fileInput: HTMLInputElement, progressEl?: HTMLElement }} refs
 * @param {string} fallbackUrl - existing image URL to keep if nothing changed (edit mode)
 */
async function resolveImageUrl({ linkInput, fileInput, progressEl }, fallbackUrl = "") {
  const linkVal = linkInput?.value?.trim();
  const file = fileInput?.files?.[0];

  if (file) {
    if (progressEl) progressEl.textContent = "Uploading image…";
    const url = await uploadToCloudinary(file, (pct) => {
      if (progressEl) progressEl.textContent = `Uploading image… ${pct}%`;
    });
    if (progressEl) progressEl.textContent = "Image uploaded.";
    return url;
  }

  if (linkVal) return linkVal;
  return fallbackUrl;
}
