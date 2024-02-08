// From https://github.com/la-voliere/react-mask-editor with fix for mount/unmount

import * as React from "react"
import "./MaskEditor.css"
import {Box, Stack} from "@mui/material";
import {useDebounce} from "react-use";

export const MaskEditorDefaults = {
    cursorSize: 10,
    cursorColor: "#ffffffff",
}

const hexToRgb = (color) => {
    const parts = color.replace("#", "").match(/.{1,2}/g);
    return parts.map(part => parseInt(part, 16));
}

export const toMask = (canvas) => {
    const ctx = canvas.getContext("2d");
    const size = {
        x: canvas.width,
        y: canvas.height,
    }
    const imageData = ctx?.getImageData(0, 0, size.x, size.y);
    const origData = Uint8ClampedArray.from(imageData.data);
    let hasData = false;
    if (imageData) {
        for (let i = 0; i < imageData?.data.length; i += 4) {
            if (imageData.data[i] === 255) hasData = true
            const pixelColor = (imageData.data[i] === 255) ? [255, 255, 255] : [0, 0, 0];
            imageData.data[i] = pixelColor[0];
            imageData.data[i + 1] = pixelColor[1];
            imageData.data[i + 2] = pixelColor[2];
            imageData.data[i + 3] = 255;
        }
        if (hasData) {
            ctx?.putImageData(imageData, 0, 0);
        } else {
            ctx?.clearRect(0, 0, size.x, size.y);
        }
    }

    const dataUrl = canvas.toDataURL();
    for (let i = 0; i < imageData?.data.length; i++) {
        imageData.data[i] = origData[i];
    }
    ctx.putImageData(imageData, 0, 0);

    return {dataUrl, hasData};
}

export const MaskEditor = (props) => {
    const src = props.src;
    const cursorSize = props.cursorSize ?? MaskEditorDefaults.cursorSize;
    const cursorColor = props.maskColor ?? MaskEditorDefaults.maskColor;

    const canvas = React.useRef(null);
    const maskCanvas = React.useRef(null);
    const cursorCanvas = React.useRef(null);
    const [context, setContext] = React.useState(null);
    const [maskContext, setMaskContext] = React.useState(null);
    const [cursorContext, setCursorContext] = React.useState(null);
    const [size, setSize] = React.useState({x: 1024, y: 1024});

    React.useLayoutEffect(() => {
        if (canvas.current && !context) {
            const ctx = (canvas.current).getContext("2d");
            setContext(ctx);
        }
    }, [canvas]);

    React.useLayoutEffect(() => {
        if (maskCanvas.current && !context) {
            const ctx = (maskCanvas.current).getContext("2d");
            if (ctx) {
                ctx.fillStyle = "#00000ff";
                ctx.fillRect(0, 0, size.x, size.y);
            }
            setMaskContext(ctx);
        }
    }, [maskCanvas]);

    React.useLayoutEffect(() => {
        if (cursorCanvas.current && !context) {
            const ctx = (cursorCanvas.current).getContext("2d");
            setCursorContext(ctx);
        }
    }, [cursorCanvas]);

    React.useLayoutEffect(() => {
        if (src && context) {
            const img = new Image;
            img.onload = evt => {
                context?.drawImage(img, 0, 0);
            }
            img.src = src;
            setSize({x: img.width, y: img.height});
        }
    }, [src, context]);

    // Pass mask canvas up
    React.useLayoutEffect(() => {
        if (props.canvasRef) {
            props.canvasRef.current = maskCanvas.current;
        }
    }, [maskCanvas]);

    React.useEffect(() => {
        let mouseHere = false;

        const onmousemove = (evt) => {
            const cssSize = {x: canvas.current.scrollWidth, y: canvas.current.scrollHeight}
            const [x, y] = [evt.offsetX * (size.x/cssSize.x), evt.offsetY * (size.y/cssSize.y)]

            if (cursorContext && mouseHere) {
                cursorContext.clearRect(0, 0, size.x, size.y);

                cursorContext.beginPath();
                cursorContext.fillStyle = `${cursorColor}88`;
                cursorContext.strokeStyle = cursorColor;
                cursorContext.arc(x, y, cursorSize, 0, 360);
                cursorContext.fill();
                cursorContext.stroke();
            }

            if (maskContext && evt.buttons > 0 && mouseHere) {
                maskContext.beginPath();
                maskContext.fillStyle = (evt.buttons > 1 || evt.shiftKey) ? "#000000ff" : "#ffffffff";
                maskContext.arc(x, y, cursorSize, 0, 360);
                maskContext.fill();
            }
        }

        const onmouseenter = () => mouseHere = true;

        const onmouseleave = () => {
            mouseHere = false;
            cursorContext.clearRect(0, 0, size.x, size.y);
        };

        cursorCanvas.current?.addEventListener("mousedown", onmousemove);
        cursorCanvas.current?.addEventListener("mousemove", onmousemove);
        cursorCanvas.current?.addEventListener("mouseenter", onmouseenter);
        cursorCanvas.current?.addEventListener("mouseleave", onmouseleave);

        return () => {
            cursorCanvas.current?.removeEventListener("mousedown", onmousemove);
            cursorCanvas.current?.removeEventListener("mousemove", onmousemove);
            cursorCanvas.current?.removeEventListener("mouseenter", onmouseenter);
            cursorCanvas.current?.removeEventListener("mouseleave", onmouseleave);
        }
    }, [cursorContext, maskContext, cursorCanvas, cursorSize, cursorColor, size]);

    const replaceMaskColor = React.useCallback((hexColor, invert) => {
        const imageData = maskContext?.getImageData(0, 0, size.x, size.y);
        const color = hexToRgb(hexColor);
        if (imageData) {
            for (let i = 0; i < imageData?.data.length; i += 4) {
                const pixelColor = ((imageData.data[i] === 255) !== invert) ? [255, 255, 255] : color;
                imageData.data[i] = pixelColor[0];
                imageData.data[i + 1] = pixelColor[1];
                imageData.data[i + 2] = pixelColor[2];
                imageData.data[i + 3] = imageData.data[i + 3];
            }
            maskContext?.putImageData(imageData, 0, 0);
        }
    }, [maskContext]);

    React.useEffect(() => replaceMaskColor(cursorColor, false), [cursorColor]);

    const cursorSizePreview = () => {
        if(cursorContext === null) return;

        cursorContext.clearRect(0, 0, size.x, size.y);
        cursorContext.beginPath();
        cursorContext.fillStyle = `${cursorColor}ff`;
        cursorContext.strokeStyle = cursorColor;
        cursorContext.arc(size.x/2, size.y/2, cursorSize, 0, 360);
        cursorContext.fill();
        cursorContext.stroke();
    };
    React.useEffect(cursorSizePreview, [cursorSize]);
    useDebounce(()=> {
        if(cursorContext === null) return
        cursorContext.clearRect(0, 0, size.x, size.y);
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
