
import { useState } from 'react';
import './App.css'
import axios from "axios"

import {Button, Container, Form} from "react-bootstrap"
import LoadingSpinner from './LoadingSpinner';

function App() {
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [error, setError] = useState("")

  const generateImages = async ()=>{
    if(prompt === "") return
    try {
      const res = await axios.post(`/api/generate-image`, { prompt })
      setPreview(`data:image/png;base64,${res.data}`)
      setLoading(false)
    }
    catch(err){
      console.log(err)
      setError(JSON.stringify(err.response.data, null, 2))
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

  return (
    <Container className='container'>

    <header>
        <h1>Imagen2 API Demonstration</h1>
    </header>
    <Form>

      <Form.Label>Enter your prompt</Form.Label>
      <Form.Control className='mb-4' onChange={e=>setPrompt(e.target.value)}/>

      <div className='sub-container'>
          <Button onClick={onFormSubmit} type="submit">Generate Image</Button>

          {loading && <LoadingSpinner />}

          {preview.length > 0 && !loading && <img src={preview} style={{ width: "1024px"}} />}

          {error.length > 0 && !loading && <pre style={{ color: "red" }}>{error}</pre>}
      </div>

      </Form>
    </Container>
  )
}

export default App
