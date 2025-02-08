export const formatFileDescription = (name: string, desc: unknown) => {

    if(Array.isArray(desc)) {
        desc = (desc as unknown[]).map(v => formatFileDescription(name, v)).join(",")
    } else if (typeof desc === "object") {
        Object.values(desc as Record<string, unknown>).map(v => formatFileDescription(name, v))
    }

    switch(name) {
        case 'Image Height':
        case 'Image Width':
            return `${desc}px`;
        default:
            return typeof desc === "object" ? JSON.stringify(desc) : desc as string;
    }
}

// Loops through segments (2 bytes) amd removes it if it has EXIF data
export const scrubExifFileData = () => {

}

export const downloadImageFromSource = (fileName: string, src: string) => {
    const aTag = document.createElement("a");
    aTag.download = fileName;
    aTag.href = src;
    document.body.append(aTag);
    aTag.click();
}