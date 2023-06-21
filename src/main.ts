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
                    if (req.url.endsWith('.pdf')) return false // ignore all links ending with `.pdf`
                    return req
                },
            })
        }
    })

    // Get actor inputs (from Apify console)
    const input: any = await Actor.getInput()
    const { startUrls } = input

    await crawler.run(startUrls)
});
