export const getParentsAndReferences = (reverseValue: any[], unigraphOrigin: any[]) => {
    const possibleParents = reverseValue?.filter(el => el?.type?.['unigraph.id'] === "$/schema/subentity").map(val => {
        return val?.['unigraph.origin']?.map((ell: any) => ell.uid) || []
    }).flat() || [];
    const parents = unigraphOrigin.filter(el => possibleParents.includes(el.uid));
    const references = unigraphOrigin.filter(el => !possibleParents.includes(el.uid));
    return [parents, references];
}