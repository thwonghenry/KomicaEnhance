import HomuExtractor from './HomuExtractor';
import TwoCatExtractor from './TwoCatExtractor';

const extractors: komicaExtractor.Index[] = [{
    extractor: HomuExtractor,
    match: /http:\/\/homu\.komica\.org.*/,
}, {
    extractor: TwoCatExtractor,
    match: /http:\/\/2cat.or.tl*/,
}];

export default function getExtractorByUrl(url: string): komicaExtractor.ExtractorClass {
    'use strict';
    for (let i: number = 0; i < extractors.length; i++) {
        if (extractors[i].match.test(url)) {
            return extractors[i].extractor;
        }
    }
};
