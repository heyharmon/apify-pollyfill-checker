import { Actor } from 'apify';
import { BasicCrawler } from 'crawlee';
import { gotScraping } from 'got-scraping';

await Actor.init();
const input = await Actor.getInput();
const crawler = new BasicCrawler({
    async requestHandler({ request }) {
        const { url } = request;
        console.log(`Processing ${url}...`);

        // Fetch the page HTML via Apify utils gotScraping
        const { body } = await gotScraping({ url });

        // Check for pollyfill
        const found = body.includes('polyfill.io')
        console.log('Found: ', found)

        // Store the results
        await Actor.pushData({
            url: request.url,
            found: found
        });
    },
});

// Use start urls from UI
await crawler.run(input.startUrls);

// Hard-coded URLs.
// await crawler.run([
//     { url: 'https://rivertown.bloomcudev.com/' },
// ]);

console.log('Crawler finished.');
await Actor.exit();