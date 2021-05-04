export function isJsonString(str: any) {
    if (!(typeof str === "string")) return false;
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return JSON.parse(str);
}

export function isUrl(str: string) {
    /* https://stackoverflow.com/a/5717133 */
    const pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return !!pattern.test(str);
}

export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            typeof reader.result === "string" ? resolve(reader.result) : reject("blob not a string");
        };
    });
}

// https://stackoverflow.com/a/55257089
// FIXME: This should be fairly performant but still a synchronous compute-heavy action. consider fixing it
export function base64ToBlob(base64: string): Blob {
    // Decode Base64 string
    const decodedData = window.atob(base64);
  
    // Create UNIT8ARRAY of size same as row data length
    const uInt8Array = new Uint8Array(decodedData.length);
  
    // Insert all character code into uInt8Array
    for (let i = 0; i < decodedData.length; ++i) {
      uInt8Array[i] = decodedData.charCodeAt(i);
    }
  
    // Return BLOB image after conversion
    return new Blob([uInt8Array]);
}

export function blobToJson(blob: Blob): Promise<any> {
    return new Promise((resolve, reject) => {
        blob.text().then(text => isJsonString(text) ? resolve(JSON.stringify(text)): reject("blob not a json"))
    })
}

export function getRefQueryUnigraphId(id: string) {
    return { "$ref": {
        "query": [{
            "key": "unigraph.id",
            "value": id
        }]
    } }
}