export const toMask = (canvas) => {
  const ctx = canvas.getContext("2d")
  const size = {
    x: canvas.width,
    y: canvas.height,
  }
  const imageData = ctx?.getImageData(0, 0, size.x, size.y)
  const origData = Uint8ClampedArray.from(imageData.data)
  let hasData = false
  if (imageData) {
    for (let i = 0; i < imageData?.data.length; i += 4) {
      if (imageData.data[i] === 255) hasData = true
      const pixelColor = (imageData.data[i] === 255) ? [255, 255, 255] : [0, 0, 0]
      imageData.data[i] = pixelColor[0]
      imageData.data[i + 1] = pixelColor[1]
      imageData.data[i + 2] = pixelColor[2]
      imageData.data[i + 3] = 255
    }
    if (hasData) {
      ctx?.putImageData(imageData, 0, 0)
    } else {
      ctx?.clearRect(0, 0, size.x, size.y)
    }
  }

  const dataUrl = canvas.toDataURL()
  for (let i = 0; i < imageData?.data.length; i++) {
    imageData.data[i] = origData[i]
  }
  ctx.putImageData(imageData, 0, 0)

  return {dataUrl, hasData}
}
