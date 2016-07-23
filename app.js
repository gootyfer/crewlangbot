'use strict'

const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const tg = new Telegram.Telegram('248872666:AAEQD7X_s2hSzjpuhxegSJ1GhKotePTahdA')

class QuestionReceivingController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    echoHandler($) {
        $.sendMessage('En chino es '+$.query.phrase)
    }

    get routes() {
        return {
            '/comosedice :phrase': 'echoHandler'
        }
    }
}

tg.router
    .when('/comosedice :phrase', new QuestionReceivingController())
