import { Actor } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee'
import * as htmlparser from 'htmlparser2'

await Actor.main(async () => {
    const crawler = new CheerioCrawler({
        async requestHandler({ $, request, enqueueLinks }) {
            const html = $('html').html() || ''
            const title = $('title').text()
            console.log(`Crawling ${title} at "${request.url}".`)

            // Parse all parts of the DOM
            let streamcells:any = []

            let parser = new htmlparser.Parser({
                onopentag: function (name, attributes) { 
                    if (name === 'stream-cell') {
                        // streamcells.push({
                        //     tag: 'stream-cell',
                        //     ...attributes
                        // })

                        streamcells.push(attributes)
                    }
                },
                // ontext: function (text) { cells.push(text) },
                // onclosetag: function () { cells.push(' ') };
            },{ decodeEntities: true })
            parser.write(html)
            parser.end()

            // Store result
            if (streamcells.length) {
                await Dataset.pushData({
                    url: request.loadedUrl,
                    title,
                    streamcells,
                })
            }

            // Add other found links to queue
            await enqueueLinks({
                strategy: 'same-domain',
                transformRequestFunction(req) {
                    // ignore all links ending with `.pdf`
                    if (req.url.endsWith('.pdf')) return false
                    return req
                },
            })
        }
    })

    // Enqueue the initial request and run the crawler
    // const input = await Actor.getInput();
    // console.log(input.startUrl);

    const startUrls = [
        'https://nwpreferredfcu.com/sitemap/',
        // 'https://nwpreferredfcu.com/personal-banking/accounts-2/checking/free-checking/'
    ]

    await crawler.run(startUrls)
});
