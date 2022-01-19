export const backlinkQuery = `(func: uid(QUERYFN_TEMPLATE)) {
    uid
    <~_value> {
        type { <unigraph.id> }
        <unigraph.origin> @filter(NOT eq(_hide, true) AND type(Entity)) {
            type { <unigraph.id> }
            uid
        }
    }
    <unigraph.origin> @filter(NOT eq(_hide, true) AND type(Entity)) {
        type { <unigraph.id> }
        uid
    }
}`;

export const getParentsAndReferences = (reverseValue: any[], unigraphOrigin: any[], currentUid?: string) => {
    const possibleParents =
        reverseValue
            ?.filter((el) => el?.type?.['unigraph.id'] === '$/schema/subentity')
            .map((val) => val?.['unigraph.origin']?.map((ell: any) => ell.uid) || [])
            .flat() || [];
    const parents = (unigraphOrigin || [])
        .filter((el) => possibleParents.includes(el.uid))
        .filter((el) => !(el?.type?.['unigraph.id'] === '$/schema/subentity' || el.uid === currentUid));
    const references = (unigraphOrigin || [])
        .filter((el) => !possibleParents.includes(el.uid))
        .filter((el) => !(el?.type?.['unigraph.id'] === '$/schema/subentity' || el.uid === currentUid));
    return [parents, references];
};
