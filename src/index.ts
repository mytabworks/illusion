interface IllussionStaticProps {
    construct: (target: any, args: any) => any
    get?: (target: any, p: string | number | symbol, receiver: any) => any
    set?: (target: any, p: string | number | symbol, receiver: any) => any
}

interface IllussionInstanceProps extends Omit<IllussionStaticProps, 'construct'> {
    has?: (target: any, p: string | number | symbol) => boolean
    deleteProperty?: (target: any, p: string | number | symbol) => boolean
}

const __illusion__ = <I>($class: any, consider = false): I => {

	/*---------------------------------------------------------------------------------------------------------------
	| issetEnabled
	|----------------------------------------------------------------------------------------------------------------
	| A toggle switch for the __isset method
	| Needed to control "prop in instance" inside of getters
	|
	|
	*/

	let issetEnabled = true

	/*---------------------------------------------------------------------------------------------------------------
	| classset
	|----------------------------------------------------------------------------------------------------------------
	| to determine if class has the property to magic.
	| same with staticclassset
	|
	*/

	let classset = false, staticclassset = false;

	/*---------------------------------------------------------------------------------------------------------------
	| __iterator()
	|----------------------------------------------------------------------------------------------------------------
	| Caches "for(let row of class)"
	| We must set the class __get() property to set this method
	| *note*
	| __iterator() was declared before we instantiate the class, so that we can set -
	| class.properties = { iterator, Symbol.iterator }
	*/

	const iterator = $class.prototype['__iterator']
	
	if (!!iterator) 
	{
		classset = true

		$class.prototype[Symbol.iterator] = function () {

			let data = this.__iterator(), index = -1, max = data.length

	        return Array.isArray(data) ? 
	        { 

	            next() { 

	            	index++

	                return {

	                    done: max === index,

	                    value: data[index]
	                }
	            }

	        } : (function* () { for(let key in data) yield {key:key, value: data[key]} })()
	    }
	}


	/*---------------------------------------------------------------------------------------------------------------
	| classHandler
	|----------------------------------------------------------------------------------------------------------------
	| Trap for class instantiation for Proxy static class handler.
	| 
	|
	*/

	const classHandler: IllussionStaticProps = Object.create(null)

	classHandler.construct = (target, args) => {


		/*---------------------------------------------------------------------------------------------------------------
		| instance
		|----------------------------------------------------------------------------------------------------------------
		| Wrapped class instance as a Proxy target
		| 
		|
		*/

		const instance = new $class(...args)

		/*---------------------------------------------------------------------------------------------------------------
		| instanceHandler
		|----------------------------------------------------------------------------------------------------------------
		| Trap for instance as Proxy handler.
		| 
		|
		*/

		const instanceHandler: IllussionInstanceProps = Object.create(null)

		/*---------------------------------------------------------------------------------------------------------------
		| __get()
		|----------------------------------------------------------------------------------------------------------------
		| Catches "instance.property"
		| We must set the class __get() property to set this method
		|
		*/ 

		const get = $class.prototype['__get']
		if (!!get) 
		{
			classset = true

			instanceHandler.get = (target, name, receiver) => {

				/*
				| We need to turn off the __isset() trap for the moment to establish compatibility with PHP behaviour
				| PHP's __get() method doesn't care about its own __isset() method, so neither should we
				*/ 

				issetEnabled = false
				const exists = name in target
				issetEnabled = true

				if (('__illusion__' === name)) 
				{
					return target
				}

				if ('constructor' === name) 
				{
					return __illusion__(target[name])
				}

				return exists ? target[name] : target.__get.call(receiver, name)

			}
		}

		/*---------------------------------------------------------------------------------------------------------------
		| __getAll()
		|----------------------------------------------------------------------------------------------------------------
		| Catches "instance.property"
		| We must set the class __getAll() property to set this method
		|
		*/ 

		const getAll = $class.prototype['__getAll']
		if (!!getAll) 
		{
			classset = true

			instanceHandler.get = (target, name) => {

				return target.__getAll.call(target, name)

			}
		}

		/*---------------------------------------------------------------------------------------------------------------
		| __set()
		|----------------------------------------------------------------------------------------------------------------
		| Catches "instance.property = ..."
		| We must set the class __set() property to set this method
		|
		*/ 

		const set = $class.prototype['__set']
		if (!!set) 
		{
			classset = true

			instanceHandler.set = (target, name, value) => {

				if (name in target) {

					target[name] = value

				} else {

					target.__set.call(target, name, value)

				}

				return true
			}
		}

		/*---------------------------------------------------------------------------------------------------------------
		| __isset()
		|----------------------------------------------------------------------------------------------------------------
		| Catches "'property' in instance"
		| We must set the class __isset() property to set this method
		|
		*/ 

		const isset = $class.prototype['__isset']
		if (!!isset) 
		{
			classset = true

			instanceHandler.has = (target, name) => {

				if (!issetEnabled) return name in target

				return target.__isset.call(target, name)
			}
		}

		/*---------------------------------------------------------------------------------------------------------------
		| __unset()
		|----------------------------------------------------------------------------------------------------------------
		| Catches "delete instance.property"
		| We must set the class __unset() property to set this method
		|
		*/ 

		const unset = $class.prototype['__unset']
		if (!!unset) 
		{
			classset = true

			instanceHandler.deleteProperty = (target, name) => {

				target.__unset.call(target, name)

				return true
			}
		}

		/*
		| if one of the properties above was established we return the Proxy else the true instance
		| @return instance
		*/

		return classset ? new Proxy(instance, instanceHandler) : instance
	}

	/*---------------------------------------------------------------------------------------------------------------
	| __getStatic()
	|----------------------------------------------------------------------------------------------------------------
	| Catches "class.property"
	| We must set the class static __getStatic() property to set this method
	|
	*/

	if ('__getStatic' in $class) {
		staticclassset = true
		classHandler.get = (target, name) => {
			if (name in target) {
				return target[name]
			} else {
				return target.__getStatic(name)
			}
		}
	}

	/*---------------------------------------------------------------------------------------------------------------
	| __setStatic()
	|----------------------------------------------------------------------------------------------------------------
	| Catches "class.property = ..."
	| We must set the class static __setStatic() property to set this method
	|
	*/

	if ('__setStatic' in $class)  {
		staticclassset = true
		classHandler.set = (target, name, value) => {
            if (name in target) {

                target[name] = value

            } else {

                target.__setStatic(name, value)

            }

            return true
		}
	}

	/*---------------------------------------------------------------------------------------------------------------
	| __callStatic()
	|----------------------------------------------------------------------------------------------------------------
	| Catches "class.property()"
	|
	| We must set the class static __callStatic() property to set this method
	|
	| *note* 
	|
	| this method will contradict the __getStatic() because they have been set in same method get()
	|
	| only __callStatic will be invoke if they are both declared 
	*/ 

	if ('__callStatic' in $class) 
	{	
		staticclassset = true

		classHandler.get = (target, name, receiver) => {

			if (('__illusion__' === name)) 
			{
				return target
			}

			return target[name] || target.__callStatic.call(receiver, name)

		}
	}

	/*---------------------------------------------------------------------------------------------------------------
	| return
	|----------------------------------------------------------------------------------------------------------------
	| if none of the method above was declared. it will return the class itself 
	*/
	
	return staticclassset || classset || consider? new Proxy($class, classHandler) : $class

}

export default __illusion__