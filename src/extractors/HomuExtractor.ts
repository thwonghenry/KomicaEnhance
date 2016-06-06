// extractor for homu.komica.org/*
enum ExtractorState {
    START,
    FIRSTPOST,
    REPLY
}
const replyInfoRegex: RegExp = /^ (\d\d)\/(\d\d)\/(\d\d)...(\d\d):(\d\d):(\d\d) ID:(.*) No\.(.*) $/;

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
       parseInt(regexMatch[6], 10)
   );
   reply.posterID = regexMatch[7];
   reply.replyID = regexMatch[8];
}

function convertThread(nodes: Node[], isThreadList: boolean): komicaExtractor.Thread {
    'use strict';
    let thread: komicaExtractor.Thread = {
        replies: [],
    };
    let reply: komicaExtractor.Reply = {};
    let state: ExtractorState = ExtractorState.START;
    thread.replies.push(reply);

    for (let i: number = 0; i < nodes.length; i++) {
        let node: Node = nodes[i];
        const nodeName: string = node.nodeName.toLowerCase();
        // state machine to extract data
        if (state === ExtractorState.START) {
            // determine whether the first post contains thumbnail
            if (nodeName === '#text') {
                // "檔名" text node, ignore it
                continue;
            } else if (nodeName === 'div') {
                // if the previous post has no reply,
                // there is a div for padding
                continue;
            } else if (nodeName === 'a') {
                // progress the node list to obtain the image
                i += 5;
                const imageElement: HTMLImageElement = ((nodes[i] as HTMLElement).children[0]) as HTMLImageElement;
                reply.image = {
                    filename: (node as Element).innerHTML,
                    src: (node as HTMLAnchorElement).href,
                    thumbnail: imageElement.src,
                };
                state = ExtractorState.FIRSTPOST;
                i++; // skip the check box
            } else if (nodeName === 'input') {
                state = ExtractorState.FIRSTPOST;
            } else {
                // end of the page
                break;
            }
        } else if (state === ExtractorState.FIRSTPOST) {
            reply.topic = (node as HTMLFontElement).innerText;
            i += 2;
            node = nodes[i];
            reply.posterName = (node as HTMLFontElement).innerText;
            i++;
            node = nodes[i];
            extractInfoToReply((node as Text).data, reply);
            // there are 4 extra node between the info text node and content node for thread list page
            if (isThreadList) {
                i += 7;
            } else {
                i += 3;
            }
            node = nodes[i];
            reply.content = node as HTMLElement;
            state = ExtractorState.REPLY;
        } else if (state === ExtractorState.REPLY) {
            if (nodeName === 'div') {
                state = undefined;
                continue;
            }
            // if there are hidden replies, fill them with empty object
            if (nodeName === 'font') {
                const infoText: string = (node as HTMLFontElement).innerText;
                const regexMatch: RegExpMatchArray
                    = infoText.match(/回應有(\d*)篇被省略/);
                const skip: number = parseInt(regexMatch[1], 10);
                for (let s: number = 0; s < skip; s++) {
                    thread.replies.push({});
                }
                i += 3;
                node = nodes[i];
            }
            reply = {};
            thread.replies.push(reply);
            // each reply is embeded inside a table element
            // retrieve the content node inside the table element
            const post: Element = (((node as HTMLElement).children[0] as HTMLElement).children[0] as HTMLElement).children[1];

            // retrieve the info of the reply
            reply.topic = (post.childNodes[2] as HTMLFontElement).innerText;
            reply.posterName = (post.childNodes[4] as HTMLFontElement).innerText;
            extractInfoToReply((post.childNodes[5] as Text).data, reply);
            // skip the text node after the table node
            i++;
            const content: string = post.childNodes[8].nodeName.toLowerCase();
            if (content === 'blockquote') {
                // has no thumbnail
                reply.content = post.childNodes[8] as HTMLElement;
            } else {
                // has thumbnail
                reply.content = post.childNodes[16] as HTMLElement;
                const imageElement: HTMLImageElement = (post.childNodes[15] as HTMLElement).children[0] as HTMLImageElement;
                const anchorElement: HTMLAnchorElement = post.childNodes[10] as HTMLAnchorElement;
                reply.image = {
                    filename: anchorElement.innerText,
                    src: imageElement.src,
                    thumbnail: anchorElement.href,
                };
            }

        }
    }
    return thread;
}

export default class HomuExtractor implements komicaExtractor.Extractor {
    private domain: string;
    constructor(domain: string) {
        this.domain = domain;
    }

    public extractThreadList(doc: HTMLDocument): komicaExtractor.Data {
        'use strict';
        const threads: HTMLElement = doc.getElementsByTagName('form')[1];
        const threadNodes: Node[][] = [[]];
        let threadIndex: number = 0;

        for (let i: number = 0; i < threads.childNodes.length; i++) {
            let node: Node = threads.childNodes[i];
            const nodeName: string = node.nodeName.toLowerCase();
            if (nodeName === 'hr') {
                // meet the boundary of previous thread, create new thread
                threadIndex++;
                threadNodes.push([]);
            } else {
                threadNodes[threadIndex].push(node);
            }
        }
        // remove the footer nodes
        threadNodes.splice(-1);
        return { threads: threadNodes.map((nodes: Node[]) => convertThread(nodes, true)) };
    }

    public extractReplyList(doc: HTMLDocument): komicaExtractor.Thread {
        'use strict';
        const replies: HTMLElement = doc.getElementsByTagName('form')[1];
        const nodes: Node[] = Array.prototype.slice.call(replies.childNodes);
        // remove the footer nodes
        let index: number = -1;
        for (let i: number = 0; i < nodes.length; i++) {
            if (nodes[i].nodeName.toLowerCase() === 'hr') {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            nodes.splice(index);
        }
        return convertThread(nodes, false);
    }

    public isReplyListPage(url: string): boolean {
        return /.*\.php\?res=.*/.test(url);
    }

    public isThreadListPage(url: string): boolean {
        return !this.isReplyListPage(url);
    }
}
