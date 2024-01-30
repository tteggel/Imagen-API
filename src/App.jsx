import { useState } from "react"
import "./App.css"
import {Button, Col, Container, Form, OverlayTrigger, Row, Tooltip} from "react-bootstrap"
import LoadingSpinner from "./LoadingSpinner"

function App() {
  const [preview, setPreview] = useState("")
  const [loading, setLoading] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [guidanceScale, setGuidanceScale] = useState(10)
  const [language, setLanguage] = useState("auto")
  const [error, setError] = useState("")

  const generateImages = async () => {
    if(prompt === "") return
    try {
      //const instance = { prompt, image: preview ? {bytesBase64Encoded: preview.split(",")[1]} : undefined }
      const instance = { prompt, negativePrompt, guidanceScale, language }
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

  const previewImage = (e) => {
    const reader = new FileReader()

    reader.addEventListener("load", () => setPreview(reader.result), false)

    if (e?.target?.files?.[0]) {
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const guidanceTooltip = (props) => {
    return (
      <Tooltip id="button-tooltip" {...props}>
        <h6 className="text-start">How strong do you want the prompt(s) to be?</h6>
        <p className="text-start">
          A larger number will make an image that is closer to your prompt(s),
          a smaller number will result in a more creative image.
          </p>
        <p className="text-start">Suggested values are:
        <ul>
          <li>0-9 (low strength)</li>
          <li>10-20 (medium strength)</li>
          <li>21+ (high strength)</li>
        </ul>
        </p>
      </Tooltip>
    )
  }

  const guidanceScaleAdvice = (g) => {
    if (g <= 9) return <strong className="text-success">weak</strong>
    else if (g <= 20 ) return <strong className="text-warning">medium</strong>
    else return <strong className="text-danger">strong</strong>
  }

  return (
    <Container className="container">

    <header>
        <h1>Image Generation</h1>
    </header>
    <Form>

      <Form.FloatingLabel label="Enter your prompt">
      <Form.Control className="mb-4" onChange={e => setPrompt(e.target.value)} placeholder="A drawing of the jabberwocky"/>
      </Form.FloatingLabel>

      <Form.FloatingLabel label="Negative prompt (optional)">
      <Form.Control className="mb-4" onChange={e => setNegativePrompt(e.target.value)} placeholder="Scary"/>
      </Form.FloatingLabel>

      <Container fluid className="mb-4">
        <Row>
          <Col md={"auto"}>
            <Form.Label>Prompt strength</Form.Label>
            <OverlayTrigger placement="right"  delay={{ show: 250, hide: 400 }} overlay={guidanceTooltip}>
              <strong>  ⓘ</strong>
            </OverlayTrigger>
          </Col>
          <Col>
            <Form.Range className="mb-4" onChange={e => setGuidanceScale(e.target.value)} min={0} max={50} step={1} value={guidanceScale}/>
          </Col>
          <Col xs={1}>
            {guidanceScale}
          </Col>
          <Col xs={1}>
            {guidanceScaleAdvice(guidanceScale)}
          </Col>
        </Row>
        <Row>
          <Col md={"auto"}><Form.Label>Language</Form.Label></Col>
          <Col>
            <Form.Select onChange={e => setLanguage(e.target.value)}>
              <option value="auto">(auto)</option>
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ja">Japanese</option>
              <option value="ko">Korean</option>
            </Form.Select>
          </Col>
        </Row>
      </Container>

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
