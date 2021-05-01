import { unpad } from "unigraph-dev-common/lib/utils/entityUtils";
import Editor from "@monaco-editor/react";
import React from "react";
import { Button } from "@material-ui/core";
import { Save } from "@material-ui/icons";

export const ExecutableCodeEditor = ({data}: any) => {
    
    const unpadded = unpad(data);

    const [currentCode, setCurrentCode] = React.useState(unpadded['src'])

    const updateCode = (newSrc: string) => 
        {window.unigraph.updateObject(data.uid, {src: newSrc})}

    function handleEditorChange(value: any, event: any) {
        setCurrentCode(value);
    }

    const displayData = {...unpadded};
    delete displayData['src']
    

    return <div>
        {JSON.stringify(displayData)}
        <Button onClick={() => updateCode(currentCode)}><Save/></Button>
        <Editor
            height="90vh"
            defaultLanguage="javascript"
            defaultValue={currentCode}
            onChange={handleEditorChange}
        />
    </div>

}