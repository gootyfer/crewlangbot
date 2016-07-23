'use strict'

const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const tg = new Telegram.Telegram('248872666:AAEQD7X_s2hSzjpuhxegSJ1GhKotePTahdA')
const storage = require('node-persist')

class QuestionReceivingController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    handle($) {
      const phrase = $.query
      storage.initSync()
      const users = storage.getItemSync('users') || []
      const usersToQuery = users.filter(user => user.language === '🇨🇳')
      usersToQuery.forEach(user => tg.api.sendMessage(user.id, `¿Podrías traducir ${phrase} para ${$.message.from.id}?`));

      $.sendMessage('Estamos preguntando a chinos por la traducción de '+phrase)
    }
}

class AnswerController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    handle($) {
        console.log($.query)
        tg.api.sendMessage($.query.chatId, `El resultado de tu traducción es ${$.query.answer}`);

        $.sendMessage('Gracias por tu ayuda')
    }

}

class ResetController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    handle($) {
        storage.initSync()
        storage.setItemSync('users',[])
        $.sendMessage('Usuarios borrados')
    }
}

class LangSettingController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    saveUserHandler($) {
        const id = $.message.from.id
        storage.initSync()
        const users = storage.getItemSync('users') || []
        if(!users.some(user => user.id===id)){
          users.push({
            id: id,
            language: $.query.language
          })
        }
        storage.setItemSync('users',users)
        $.sendMessage('Tu idioma es '+$.query.language)
    }

    get routes() {
        return {
            '/miidioma :language': 'saveUserHandler'
        }
    }
}

class ListUsersController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    handle($) {
        storage.initSync()
        const users = storage.getItemSync('users') || []
        users.forEach(user => $.sendMessage(`${user.id} habla ${user.language}`));
    }
}

class OtherwiseController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    handle($) {
        console.log($)
        $.sendMessage('No te entiendo')
    }
}

tg.router
    .when('/comosedice', new QuestionReceivingController())
    .when('/miidioma :language', new LangSettingController())
    .when('/enviar :answer :chatId', new AnswerController())
    .when('/listusers', new ListUsersController())
    .when('/resetusers', new ResetController())
    .otherwise(new OtherwiseController())
