// src/utils/cloudinary.js
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "ecommerce_upload"); // your unsigned preset

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/
dwdu05lbb/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();
  return data.secure_url; // returns hosted image URL
}
