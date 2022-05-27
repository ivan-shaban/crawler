import Crawler from 'crawler'
import heroes from '../data/heroes.json'
import path from 'path'
import fs from 'fs'

const host = 'https://liquipedia.net'
const crawler = new Crawler({
    maxConnections: 2,
})

const ids = Object.values(heroes).map(({localized_name, name}) => {
    return {remoteId: localized_name, name}
})

const locales: Record<string, string> = {}
const images: Record<string, string> = {}

crawler.queue([ids.map(({remoteId: id, name}) => {
    const uri = `${host}/dota2/${id.replace(/\s/g, '_')}`

    return {
        uri,
        callback: function (error: Error, res: Crawler.CrawlerRequestResponse, done: () => void) {
            if (error) {
                console.log(uri, error)
            } else {
                console.log(uri, 'OK')

                const smallImage = res.$(`.mw-headline>a>img`).attr('src')!
                const fullName = res.$(`.mw-headline>b`).text()
                const quote = res.$(`blockquote.quote.wiki-bordercolor-dark.wiki-backgroundcolor-light`).text()
                const description = res.$(`blockquote.quote.wiki-bordercolor-dark.wiki-backgroundcolor-light`).prev('p').text()

                locales[`${name}.name`] = fullName
                locales[`${name}.quote`] = quote
                locales[`${name}.description`] = description
                images[name] = `${host}${smallImage}`
            }
            done()
        },
    }
})])

crawler.on('drain', () => {
    // generate path to file where we wanna save result data
    const localesPathname = path.join(__dirname, '..', 'data', 'locales.json')
    const imagesPathname = path.join(__dirname, '..', 'data', 'images.json')

    // save result data into file
    fs.writeFileSync(localesPathname, JSON.stringify(locales, null, 4))
    fs.writeFileSync(imagesPathname, JSON.stringify(images, null, 4))
})
