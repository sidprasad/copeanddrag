
//Map that has languages as keys and Maps with IDs and Errors as the values
//Each language will have its own internal state of errors for each command
export let langMap: Map<string, Map<string, (a: Array<any>) => Error >>

export function addLang(lang: string){
    langMap.set(lang, new Map<string,  (a: Array<any>) => Error>)
}


export function addError(lang: string, id: string, err: (a: Array<any>) => Error){
    if (langMap.has(lang)){
        let langErr = langMap.get(lang)
        if(langErr != undefined){
            langErr.set(id, err)
        }
    } else {
        throw new NoLangError(NoLangError.ERROR_MSG)
    }
}

export function addAllError(id: string, errList: Map<string,  (a: Array<any>) => Error>){
    if (idInMap(id)){
        throw new ArgsError(ArgsError.ID_EXISTS)
    } 
    langMap.forEach((value, key, map) => {
        let errors = errList.get(key)
        if (errors == undefined){
            throw new ArgsError(ArgsError.MISSING_LANG)
        }else{
            if(errors instanceof Error) 
                addError(key, id, errors)
        } 
       
    })
    
}

function idInMap(id: string){
    const iterator = langMap.entries()
    for (let i=0; i<langMap.size; i++){
        if(iterator.next().value.has(id))
            return false
    }
    return true;
} 

class NoLangError extends Error{
    public static ERROR_MSG: string = "Given language not in the list of possible languages"
    constructor (msg:string) {
        super(msg)
    }
}
class ArgsError extends Error{
    public static WRONG_SIZE: string = "The given arrray does not have a error for each language"
    public static ID_EXISTS: string = "The given id already has a error message in the dictionary"
    public static MISSING_LANG: string = "The given map is missing a language that has been defined"
    constructor (msg:string) {
        super(msg)
    }
}
