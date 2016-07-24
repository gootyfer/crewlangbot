'use strict'

const Telegram = require('telegram-node-bot')
const TelegramBaseController = Telegram.TelegramBaseController
const tg = new Telegram.Telegram('248872666:AAEQD7X_s2hSzjpuhxegSJ1GhKotePTahdA')
const storage = require('node-persist')

function saveUserLanguage(id, language){
  storage.initSync()
  const users = storage.getItemSync('users') || []
  if(!users.some(user => user.id===id)){
    users.push({
      id: id,
      language: language
    })
  }
  storage.setItemSync('users',users)
}

function getUsers(){
  storage.initSync()
  return storage.getItemSync('users') || []
}

class StartController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    handle($) {
        const languages = [ '🇨🇳' , '🇪🇸'];
        const form = {
            language: {
                q: '¿Qué idioma hablas? Usa 🇨🇳 o 🇪🇸',
                error: 'Ese idioma áun no lo hablamos.',
                validator: (message, callback) => {
                    if(languages.includes(message.text)) {
                        callback(true, message.text) //you must pass the result also
                        return
                    }
                    callback(false)
                }
            }
        }

        $.runForm(form, (result) => {
            saveUserLanguage($.message.from.id, result.language)
            $.sendMessage('¡Perfecto! Ya puedes empezar a pedir traducciones.')
            $.runMenu({
              message: 'Ayuda',
              'Ayuda': {
                  resizeKeyboard: true
              }
          })
        })
    }
}

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

      console.log($)
      $.sendMessage('Estamos preguntando a nuestros traductores chinos cómo se dice '+phrase)
    }
}

class AnswerController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    handle($) {
        tg.api.sendMessage($.query.chatId, `El resultado de tu traducción es`);
        tg.api.sendMessage($.query.chatId, $.query.answer);

        $.sendMessage('Gracias por tu ayuda, James')
    }

}

class HelpController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    handle($) {
        $.sendMessage('Escribe "Como se dice " y el texto que quieres traducir')
    }

}

class BroadcastController extends TelegramBaseController {
    /**
     * @param {Scope} $
     */

    handle($) {
      let message = "Si te ha gustado CrewLang, copia este enlace y compártelo por Dios telegram.me/crewLangBot"
      const users = getUsers()
      users.forEach(user => {tg.api.sendMessage(user.id, message);});
      $.sendMessage('Spam enviado')
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
        $.sendMessage('No te entiendo')
    }
}

tg.router
    .when('/start', new StartController())
    .when('Como se dice', new QuestionReceivingController())
    .when('Ayuda', new HelpController())
    .when('/miidioma :language', new LangSettingController())
    .when('/enviar :answer :chatId', new AnswerController())
    .when('/listusers', new ListUsersController())
    .when('/resetusers', new ResetController())
    .when('/sendall', new BroadcastController())
    .otherwise(new OtherwiseController())
