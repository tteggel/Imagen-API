import { useState } from "react"
import "./App.css"
import {Button, Container, Form} from "react-bootstrap"
import LoadingSpinner from "./LoadingSpinner"

function App() {
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [error, setError] = useState("")

  const generateImages = async () => {
    if(prompt === "") return
    try {
      //const instance = { prompt, image: preview ? {bytesBase64Encoded: preview.split(",")[1]} : undefined }
      const instance = { prompt }
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(instance)
      })
      if (!res.ok) throw new Error(await res.text())
      setPreview(`data:image/png;base64,${await res.text()}`)
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
    setLoading(true)
    setError("")
    return generateImages()
  }

  function previewImage(e) {
    const reader = new FileReader()

    reader.addEventListener("load", () => setPreview(reader.result), false)

    if (e?.target?.files?.[0]) {
      reader.readAsDataURL(e.target.files[0])
    }
  }

  return (
    <Container className="container">

    <header>
        <h1>Imagen2 API Demonstration</h1>
    </header>
    <Form>

      <Form.Label>Enter your prompt</Form.Label>
      <Form.Control className="mb-4" onChange={e => setPrompt(e.target.value)}/>
      {/*<Form.Control className="mb-4" type="file" onChange={previewImage}/>*/}

      <div className='sub-container'>
        <Button onClick={onFormSubmit} type="submit">Generate Image</Button>

        {loading && <LoadingSpinner/>}

        {preview.length > 0 && !loading && <img id="baseImage" src={preview} style={{width: "1024px"}}/>}

        {error.length > 0 && !loading && <pre style={{color: "red"}}>{error}</pre>}

        {/*<Button onClick={e=>setPreview("")}>Clear Image</Button>*/}
      </div>

    </Form>
    </Container>
  )
}

export default App
