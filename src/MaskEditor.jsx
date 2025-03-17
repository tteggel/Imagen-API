// From https://github.com/la-voliere/react-mask-editor with fix for mount/unmount

import * as React from "react"
import "./MaskEditor.css"
import {useDebounce} from "react-use"
import PropTypes from "prop-types"
import {MaskEditorDefaults} from "./MaskEditorDefaults.js"

const hexToRgb = (color) => {
  const parts = color.replace("#", "").match(/.{1,2}/g)
  return parts.map(part => parseInt(part, 16))
}

export const MaskEditor = (props) => {
  const src = props.src
  const cursorSize = props.cursorSize ?? MaskEditorDefaults.cursorSize
  const cursorColor = props.cursorColor ?? MaskEditorDefaults.cursorColor

  const canvas = React.useRef(null)
  const maskCanvas = React.useRef(null)
  const cursorCanvas = React.useRef(null)
  const [context, setContext] = React.useState(null)
  const [maskContext, setMaskContext] = React.useState(null)
  const [cursorContext, setCursorContext] = React.useState(null)
  const [size, setSize] = React.useState({x: 1024, y: 1024})

  React.useLayoutEffect(() => {
    if (canvas.current && !context) {
      const ctx = (canvas.current).getContext("2d")
      setContext(ctx)
    }
  }, [canvas, context])

  React.useLayoutEffect(() => {
    if (maskCanvas.current && !context) {
      const ctx = (maskCanvas.current).getContext("2d")
      if (ctx) {
        ctx.fillStyle = "#000000ff"
        ctx.fillRect(0, 0, size.x, size.y)
      }
      setMaskContext(ctx)
    }
  }, [maskCanvas, context, size.x, size.y])

  React.useLayoutEffect(() => {
    if (cursorCanvas.current && !context) {
      const ctx = (cursorCanvas.current).getContext("2d")
      setCursorContext(ctx)
    }
  }, [cursorCanvas, context])

  React.useLayoutEffect(() => {
    if (src && context) {
      const img = new Image(size.x, size.y)
      img.onload = () => {
        context?.drawImage(img, 0, 0)
      }
      img.src = src
      setSize({x: img.width, y: img.height})
    }
  }, [src, context, size.x, size.y])

  // Pass mask canvas up
  React.useLayoutEffect(() => {
    if (props.canvasRef) {
      props.canvasRef.current = maskCanvas.current
    }
  }, [maskCanvas, props.canvasRef])

  React.useEffect(() => {
    let mouseHere = false

    const onmousemove = (evt) => {
      const cssSize = {x: canvas.current.scrollWidth, y: canvas.current.scrollHeight}
      const [x, y] = [evt.offsetX * (size.x/cssSize.x), evt.offsetY * (size.y/cssSize.y)]

      if (cursorContext && mouseHere) {
        cursorContext.clearRect(0, 0, size.x, size.y)

        cursorContext.beginPath()
        cursorContext.fillStyle = `${cursorColor}88`
        cursorContext.strokeStyle = cursorColor
        cursorContext.arc(x, y, cursorSize, 0, 360)
        cursorContext.fill()
        cursorContext.stroke()
      }

      if (maskContext && evt.buttons > 0 && mouseHere) {
        maskContext.beginPath()
        maskContext.fillStyle = (evt.buttons > 1 || evt.shiftKey) ? "#000000ff" : "#ffffffff"
        maskContext.arc(x, y, cursorSize, 0, 360)
        maskContext.fill()
      }
    }

    const onmouseenter = () => mouseHere = true

    const onmouseleave = () => {
      mouseHere = false
      cursorContext.clearRect(0, 0, size.x, size.y)
    }

    const currentCanvas = cursorCanvas.current
    currentCanvas?.addEventListener("mousedown", onmousemove)
    currentCanvas?.addEventListener("mousemove", onmousemove)
    currentCanvas?.addEventListener("mouseenter", onmouseenter)
    currentCanvas?.addEventListener("mouseleave", onmouseleave)

    return () => {
      currentCanvas?.removeEventListener("mousedown", onmousemove)
      currentCanvas?.removeEventListener("mousemove", onmousemove)
      currentCanvas?.removeEventListener("mouseenter", onmouseenter)
      currentCanvas?.removeEventListener("mouseleave", onmouseleave)
    }
  }, [cursorContext, maskContext, cursorCanvas, cursorSize, cursorColor, size])

  const replaceMaskColor = React.useCallback((hexColor, invert) => {
    const imageData = maskContext?.getImageData(0, 0, size.x, size.y)
    const color = hexToRgb(hexColor)
    if (imageData) {
      for (let i = 0; i < imageData?.data.length; i += 4) {
        const pixelColor = ((imageData.data[i] === 255) !== invert) ? [255, 255, 255] : color
        imageData.data[i] = pixelColor[0]
        imageData.data[i + 1] = pixelColor[1]
        imageData.data[i + 2] = pixelColor[2]
        imageData.data[i + 3] = imageData.data[i + 3]
      }
      maskContext?.putImageData(imageData, 0, 0)
    }
  }, [maskContext, size.x, size.y])

  React.useEffect(() => replaceMaskColor("#000000ff", false), [cursorColor, replaceMaskColor])

  const cursorSizePreview = () => {
    if(cursorContext === null) return

    cursorContext.clearRect(0, 0, size.x, size.y)
    cursorContext.beginPath()
    cursorContext.fillStyle = `${cursorColor}ff`
    cursorContext.strokeStyle = cursorColor
    cursorContext.arc(size.x/2, size.y/2, cursorSize, 0, 360)
    cursorContext.fill()
    cursorContext.stroke()
  }
  React.useEffect(cursorSizePreview, [cursorSize, cursorColor, cursorContext, size.x, size.y])
  useDebounce(()=> {
    if(cursorContext === null) return
    cursorContext.clearRect(0, 0, size.x, size.y)
  }, 1500, [cursorSize])

  return <>
    <canvas
      ref={canvas}
      width={size.x}
      height={size.y}
      style={{
        zIndex: 10,
      }}
    />
    <canvas
      ref={maskCanvas}
      width={size.x}
      height={size.y}
      style={{
        zIndex: 20,
        opacity: 0.75,
        mixBlendMode: "difference",
      }}
    />
    <canvas
      ref={cursorCanvas}
      width={size.x}
      height={size.y}
      style={{
        zIndex: 30,
      }}
      onContextMenu={(e)=>{e.preventDefault(); return false}}
    />
  </>
}
MaskEditor.propTypes = {
  src: PropTypes.string.isRequired,
  cursorSize: PropTypes.number,
  cursorColor: PropTypes.string,
  canvasRef: PropTypes.object,
}
