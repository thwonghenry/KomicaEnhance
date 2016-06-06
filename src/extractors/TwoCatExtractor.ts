const replyInfoRegex: RegExp = /^ \[(\d\d)\/(\d\d)\/(\d\d)...(\d\d):(\d\d) ID:(.*)\] $/;

function extractInfoToReply(infoText: string, reply: komicaExtractor.Reply): void {
   'use strict';
   const regexMatch: RegExpMatchArray = infoText.match(replyInfoRegex);
   // construct the date object from the info text
   reply.date = new Date(
       2000 + parseInt(regexMatch[1], 10), // does not support < 2000
       parseInt(regexMatch[2], 10),
       parseInt(regexMatch[3], 10),
       parseInt(regexMatch[4], 10),
       parseInt(regexMatch[5], 10),
       0
   );
   reply.posterID = regexMatch[6];
}

function convertThread(threadElements: HTMLElement[]): komicaExtractor.Thread {
    'use strict';
    const firstPost: HTMLElement = threadElements[0];
    let replies: komicaExtractor.Reply[] = [];
    let reply: komicaExtractor.Reply = {};
    const innerFirstPost: HTMLElement = firstPost.children[0] as HTMLElement;

    reply.replyID = firstPost.id.slice(1); // remove the "r" prefix

    // get the image
    let imageNameElement: HTMLAnchorElement = innerFirstPost.children[0] as HTMLAnchorElement;
    reply.image = {
        filename: imageNameElement.innerText,
        src: imageNameElement.href,
    };
    let thumbnailElement: HTMLImageElement = (innerFirstPost.children[3] as HTMLElement).children[0] as HTMLImageElement;
    reply.image.thumbnail = thumbnailElement.src;

    //  get the info
    let infoElement: HTMLElement = innerFirstPost.children[6] as HTMLElement;
    extractInfoToReply(infoElement.childNodes[3].textContent, reply);
    reply.posterName = infoElement.childNodes[1].textContent.slice(1, -1); // slice out \n and space
    reply.topic = infoElement.children[0].innerHTML;
    reply.content = innerFirstPost.children[9] as HTMLElement;
    replies.push(reply);

    // skip the replies
    const skipTextElement: HTMLElement = innerFirstPost.children[10] as HTMLElement;
    if (skipTextElement && skipTextElement.tagName.toLowerCase() === 'span') {
        const skipText: string = skipTextElement.innerHTML;
        const skipRegex: RegExp = /レス (\d*) 件省略/;
        const skipNumber: number = parseInt(skipText.match(skipRegex)[1], 10);
        for (let i: number = 0; i < skipNumber; i++) {
            replies.push({}); // fill the skipped reply
        }
    }

    for (let i: number = 1; i < threadElements.length; i++) {
        const innerReply: HTMLElement = threadElements[i].children[0] as HTMLElement;
        reply = {};
        reply.replyID = innerReply.children[0].id;

        // get the info
        infoElement = innerReply.children[1] as HTMLElement;
        extractInfoToReply(infoElement.childNodes[3].textContent, reply);
        reply.posterName = infoElement.childNodes[1].textContent.slice(1, -1); // slice out \n and space
        reply.topic = infoElement.children[0].innerHTML;

        imageNameElement = innerReply.children[4] as HTMLAnchorElement;
        if (imageNameElement) {
            // contains image
            thumbnailElement = (innerReply.children[7] as HTMLElement).children[0] as HTMLImageElement;
            reply.image = {
                filename: imageNameElement.innerText,
                src: imageNameElement.href,
                thumbnail: thumbnailElement.src,
            };
            reply.content = innerReply.children[9] as HTMLElement;
        } else {
            // no image
            reply.content = innerReply.children[3] as HTMLElement;
        }
        replies.push(reply);
    }

    return { replies };
}

export default class TwoCatExtractor implements komicaExtractor.Extractor {
    private domain: string;
    constructor(domain: string) {
        this.domain = domain;
    }

    public extractThreadList(doc: HTMLDocument): komicaExtractor.Data {
        const threadElement: HTMLElement = doc.getElementById('threads');
        let threadNodes: HTMLElement[][] = [];
        let threadIndex: number = 0;
        for (let i: number = 0; i < threadElement.children.length; i++) {
            if (threadElement.children[i].tagName.toLowerCase() === 'hr') {
                threadNodes.push([]);
                threadIndex++;
            } else {
                threadNodes[threadIndex].push(threadElement.children[i] as HTMLElement);
            }
        }
        return {
            threads: threadNodes.map(convertThread),
        };
    }

    public extractReplyList(doc: HTMLDocument): komicaExtractor.Thread {
        const threadNodes: HTMLElement[] = Array.prototype.slice.apply(doc.getElementById('threads').children);
        return convertThread(threadNodes);
    }

    public isReplyListPage(url: string): boolean {
        return /.*\.php\?res=.*/.test(url);
    }

    public isThreadListPage(url: string): boolean {
        return !this.isReplyListPage(url);
    }
}
