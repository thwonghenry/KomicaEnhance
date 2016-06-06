import getExtractorByUrl from '../index';

function init(): void {
    'use strict';
    const extractorClass: komicaExtractor.ExtractorClass = getExtractorByUrl(window.location.href);
    if (extractorClass) {
        const extractor: komicaExtractor.Extractor = new extractorClass(window.location.host);
        if (extractor.isReplyListPage(window.location.href)) {
            console.log(extractor.extractReplyList(document));
        } else {
            console.log(extractor.extractThreadList(document));
        }
    } else {
        console.error('site not supported!');
    }

}

window.addEventListener('load', init);
