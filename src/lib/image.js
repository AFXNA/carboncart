// Downscale a user photo to a JPEG (max side 1024px) so uploads stay small; returns { image (base64), mime, url (preview) }.
export async function prepareImage(file, maxSide = 1024) {
  if (!file.type.startsWith("image/")) throw new Error("Please choose an image file.");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const url = canvas.toDataURL("image/jpeg", 0.85);
  return { image: url.split(",")[1], mime: "image/jpeg", url };
}
