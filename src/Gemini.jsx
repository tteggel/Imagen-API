import {Button, Container} from "@mui/material";
import LoadingSpinner from "./LoadingSpinner.jsx";
import {useState} from "react";

function Gemini() {
    const [preview, setPreview] = useState("")
    const [loading, setLoading] = useState(false)
    const [history, setHistory] = useState([])
    const [prompt, setPrompt] = useState([])
    const [text, setText] = useState("")
    const [negativePrompt, setNegativePrompt] = useState(1)
    const [guidanceScale, setGuidanceScale] = useState(10)
    const [language, setLanguage] = useState("auto")
    const [error, setError] = useState("")

    const generateText = async () => {
        if(text === "") return
        try {
            //const instance = { prompt, image: preview ? {bytesBase64Encoded: preview.split(",")[1]} : undefined }
            const instance = { prompt }
            const res = await fetch("/api/generate-text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(instance)
            })
            if (!res.ok) throw new Error(await res.text())
            setPreview(await res.text())
            setLoading(false)
        }
        catch(err){
            setError(err.message)
            setPreview("")
            setLoading(false)
        }
    }

    const onFormSubmit = (e) => {
        e.preventDefault()
        history.push({role: "user", text})
        setHistory(history)
        setText("")
        setLoading(true)
        setError("")
        return generateText()
    }

    const formatHistoryItem = (item) => {
        return (
        <li>
            {item.text ? item.text : item.inlineData ? <img src={`data:${item.inlineData.mimeType};base64,${item.inlineData.data}`}/> : "Unknown part type"}
        </li>
        )
    }

    return (
    <Container className="container">
        <ul>{prompt.map(formatHistoryItem)}</ul>

        {!loading && <Button onClick={onFormSubmit} className="mb-4">Submit Prompt</Button>}

        {loading && <LoadingSpinner/>}

        {preview.length > 0 && !loading && <p>{preview}</p>}

        {error.length > 0 && !loading && <pre className="text-danger">{error}</pre>}

    </Container>
    )
}

export default Gemini
