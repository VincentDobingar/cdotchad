import { useState } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export default function TestQuill() {
  const [value, setValue] = useState("");
  return (
    <div className="p-6">
      <h2 className="mb-2">Éditeur Test</h2>
      <div className="bg-white border rounded overflow-hidden">
        <ReactQuill value={value} onChange={setValue} />
      </div>
    </div>
  );
}