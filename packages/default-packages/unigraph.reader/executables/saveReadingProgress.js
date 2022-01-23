const { contextUid, uid, callbacks } = context.params;
const doc = callbacks.getDocument().current.contentDocument;
const win = callbacks.getDocument().current.contentWindow;
if (!doc || !win) return;

function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (win.innerHeight || doc.documentElement.clientHeight) &&
        rect.right <= (win.innerWidth || doc.documentElement.clientWidth)
    );
}

const getPercent = () => {
    const height = Math.max(
        doc.body.scrollHeight,
        doc.body.offsetHeight,
        doc.documentElement.clientHeight,
        doc.documentElement.scrollHeight,
        doc.documentElement.offsetHeight,
    );
    const scrollFromTop = doc.documentElement.scrollTop || doc.body.scrollTop;
    if (scrollFromTop + doc.documentElement.clientHeight >= height) return 100;
    return parseInt((scrollFromTop / height) * 100);
};

const all = doc.body.querySelectorAll('*');
let progress = false;
let percent = 0;
for (let i = 0, max = all.length; i < max; i++) {
    const curr = all[i];
    if (i !== 0 && typeof curr.textContent === 'string' && curr.textContent !== '' && isInViewport(curr)) {
        progress = [all[i - 1].outerHTML, all[i].outerHTML, all[i + 1].outerHTML];
        percent = getPercent();
        break;
    }
}

if (progress) {
    // Now we can add it to reading progress!
    const obj = {
        item: { uid },
        context: { uid: contextUid },
        progress: JSON.stringify(progress),
        percent,
    };
    // console.log(obj);
    setTimeout(async () => {
        const uids = await unigraph.addObject(obj, '$/schema/incremental_reader_item');
        await unigraph.runExecutable('$/executable/add-item-to-list', { where: '$/entity/read_later', item: uids[0] });
    }, 0);
    callbacks.closeTab();
}
