type ExternalNamespace = {
    name: string,
    createLink: (str: string) => string,
    participants: any[]
}

export const externalNamespaces: ExternalNamespace[] = [
    {
        name: "Anagora",
        createLink: (name: string) => {
            const newName = name.replace(/ /g, "-");
            return `https://anagora.org/${newName}`
        },
        participants: ["773144670507499521"]
    }
]