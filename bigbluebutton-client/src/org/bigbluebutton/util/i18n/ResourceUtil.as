/**
* BigBlueButton open source conferencing system - http://www.bigbluebutton.org/
* 
* Copyright (c) 2012 BigBlueButton Inc. and by respective authors (see below).
*
* This program is free software; you can redistribute it and/or modify it under the
* terms of the GNU Lesser General Public License as published by the Free Software
* Foundation; either version 3.0 of the License, or (at your option) any later
* version.
* 
* BigBlueButton is distributed in the hope that it will be useful, but WITHOUT ANY
* WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A
* PARTICULAR PURPOSE. See the GNU Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public License along
* with BigBlueButton; if not, see <http://www.gnu.org/licenses/>.
*
*/
package org.bigbluebutton.util.i18n
{
	import com.asfusion.mate.events.Dispatcher;
	
	import flash.events.Event;
	import flash.events.EventDispatcher;
	import flash.events.IEventDispatcher;
	import flash.external.ExternalInterface;
	import flash.globalization.Collator;
	import flash.globalization.CollatorMode;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	
	import mx.core.FlexGlobals;
	import mx.events.ResourceEvent;
	import mx.resources.ResourceManager;
	
	import org.as3commons.lang.StringUtils;
	import org.as3commons.logging.api.ILogger;
	import org.as3commons.logging.api.getClassLogger;
	import org.bigbluebutton.common.logging.LogUtil;
	import org.bigbluebutton.common.events.LocaleChangeEvent;
	import org.bigbluebutton.core.Options;
	import org.bigbluebutton.core.UsersUtil;
	import org.bigbluebutton.main.model.options.LanguageOptions;

	public class ResourceUtil extends EventDispatcher {
		private static const LOGGER:ILogger = getClassLogger(ResourceUtil);

		private static var instance:ResourceUtil = null;
		private var inited:Boolean = false;
		private var dispatcher:Dispatcher = new Dispatcher();

		private static var BBB_RESOURCE_BUNDLE:String = 'bbbResources';
		private static var MASTER_LOCALE:String;
		private static var DEFAULT_LOCALE_IDENTIFIER:String = "default";
		
		[Bindable] public var locales:Array = new Array();
		
		private var preferredLocale:String
		private var preferredDirection:String
		
		public function ResourceUtil(enforcer:SingletonEnforcer) {
			if (enforcer == null) {
				throw new Error( "You Can Only Have One ResourceUtil" );
			}
		}
		
		private function isInited():Boolean {
			return inited;
		}
		
		public function initialize():void {
			var languageOptions : LanguageOptions = Options.getOptions(LanguageOptions) as LanguageOptions;
			
			// We embedd the master locale within the application to save resources loading and load
			// the preferred locale at the first shot
			MASTER_LOCALE = FlexGlobals.topLevelApplication.systemManager.info()['compiledLocales'][0];
			
			// Add a random string on the query so that we always get an up-to-date config.xml
			var date:Date = new Date();
			
			var _urlLoader:URLLoader = new URLLoader();     
			_urlLoader.addEventListener(Event.COMPLETE, handleComplete);
      
      		var localeReqURL:String = languageOptions.localesConfig + "?a=" + date.time;
			_urlLoader.load(new URLRequest(localeReqURL));
		}
		
		private function handleComplete(e:Event):void{
			parse(new XML(e.target.data));		
									
			preferredLocale = getDefaultLocale();
<<<<<<< HEAD
			LOGGER.debug("Setting preferred locale=" + preferredLocale);
			// Improve language detection
=======
			if (preferredLocale != MASTER_LOCALE) {
        		LOGGER.debug("Preferred locale={0} is not the same as master locale={1}", [preferredLocale, MASTER_LOCALE]);
				loadMasterLocale(MASTER_LOCALE);
			}
			
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
			setPreferredLocale(preferredLocale);
		}
		
		private function parse(xml:XML):void{		 	
			var list:XMLList = xml.locale;
			var locale:XML;
						
			locales.push({
				code: DEFAULT_LOCALE_IDENTIFIER,
				name: "",
				native: "",
				direction: "ltr"
			});

			for each(locale in list){
				locales.push({
					code: locale.@code.toString(),
					name: locale.@name.toString(),
					native: locale.@native.toString(),
					direction: locale.@direction.valueOf().toString().toLowerCase() == "rtl" ? "rtl" : "ltr"
				});
			}							
		}
		
		private function getDefaultLocale():String {
			return ExternalInterface.call("getLanguage");
		}
		
<<<<<<< HEAD
		private function findPreferredLocale(prefLocale:String):Object {
			for each(var item:* in locales) {
				if (prefLocale == item.code)
					return item;
=======
		private function findPreferredLocale(prefLocale:String) : * {
			var item:* = null;
			// Lookginf for locale in format 'en_US'
			for each(item in locales) {
				if (prefLocale == item.code)
					return item;
			}
			// If not found we look for form 'en'
			var mainLocale : String = prefLocale.substr(0,2);
			for each(item in locales) {
				if (mainLocale == item.code)
					return item;
			}
			// If not found we look for the first item that contains 'en'
			for each(item in locales) {
				if (StringUtils.startsWith(item.code, mainLocale))
					return item;
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
			}
			return null;
		}
		
		private function getIndexForLocale(prefLocale:String):int {
			for (var i:Number = 0; i < locales.length; i++) {
				if (prefLocale == locales[i].code)
					return i;
			}
			return -1;
		}
		
<<<<<<< HEAD
		public function setPreferredLocale(localeCode:String):void {
=======
		public function setPreferredLocale(locale:String):void {
			var localeCode : String = locale;
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
			if (localeCode == DEFAULT_LOCALE_IDENTIFIER) {
				localeCode = getDefaultLocale();
			}

<<<<<<< HEAD
			var localeInfo:Object = findPreferredLocale(localeCode)
			if (localeInfo != null) {
				preferredLocale = localeCode;
				preferredDirection = localeInfo.direction;
			}else{
				LOGGER.debug("Preferred locale wasn't in the list of locales falling back to ["+MASTER_LOCALE+"]");
				preferredLocale = MASTER_LOCALE;
				preferredDirection = "ltr";
			}

=======
			var foundLocale : Object = findPreferredLocale(localeCode);
			if (foundLocale) {
				preferredLocale = foundLocale.code;
				preferredDirection = foundLocale.direction;
			} else {
				preferredLocale = MASTER_LOCALE;
				preferredDirection = "ltr";
			}
			
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
			changeLocale(preferredLocale);
		}
		
		private function localesCompareFunction(a:Object, b:Object):int {
			var sorter:Collator = new Collator(preferredLocale, CollatorMode.SORTING);
			// position the "Default language" option at the top of the list
			if (a.code == DEFAULT_LOCALE_IDENTIFIER) {
				return -1;
			}
			if (b.code == DEFAULT_LOCALE_IDENTIFIER) {
				return 1;
			}
			return sorter.compare(a.name, b.name);
		}

		private function reloadLocaleNames():void {
			// @fixme : should use "default" string instead of [0].code
			locales[0].name = locales[0].native = ResourceUtil.getInstance().getString("bbb.langSelector." + locales[0].code, null, getDefaultLocale());
			locales.sort(localesCompareFunction);
		}

<<<<<<< HEAD
=======
		private function loadMasterLocale(locale:String):void {
      		LOGGER.debug("Loading master locale={0}", [locale]);
			/**
			 *  http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/mx/resources/IResourceManager.html#localeChain
			 *  Always load the default language, so if the chosen language 
			 *  doesn't provide a resource, the default language resource is used
			 */
			var dispatcher:IEventDispatcher = loadResource(locale);
			dispatcher.addEventListener(ResourceEvent.COMPLETE, onMasterLocaleLoaded);
		}
		
		private function onMasterLocaleLoaded(event:ResourceEvent):void {
			LOGGER.debug("Master locale is loaded");
			masterLocaleLoaded = true;
			if (masterLocaleLoadedCallback != null) {
				LOGGER.debug("Calling callback to load a second language");
				masterLocaleLoadedCallback();
			}
		}

>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
		private function loadResource(language:String):IEventDispatcher {
			// Add a random string on the query so that we don't get a cached version.
			var languageOptions : LanguageOptions = Options.getOptions(LanguageOptions) as LanguageOptions;

			var date:Date = new Date();
<<<<<<< HEAD
			var localeURI:String = languageOptions.localesDirectory + language + '_resources.swf?a=' + date.time;
			LOGGER.debug("Loading locale " +  localeURI);
			return ResourceManager.getInstance().loadResourceModule(localeURI, false);
		}
=======
			var localeURI:String = buildRequestURL() + 'client/locale/' + language + '_resources.swf?a=' + date.time;
			LOGGER.debug("Loading locale {0}", [localeURI]);
			return resourceManager.loadResourceModule( localeURI, false);
		}		
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
		
		public static function getInstance():ResourceUtil {
			if (instance == null) {
				instance = new ResourceUtil(new SingletonEnforcer);
			} 
			return instance;
        }
        
		private function changeLocaleHelper(locale:String):void {
			// we bundle the master locale into the application now so it will already 
			// be there and the loading COMPLETE won't fire
			if (locale == MASTER_LOCALE) {
				LOGGER.debug("Requested master locale, skipping right to localeChangeComplete")
				localeChangeComplete();
				return;
			}
			
      		var eventDispatcher:IEventDispatcher = loadResource(locale);
			eventDispatcher.addEventListener(ResourceEvent.COMPLETE, localeChangeComplete);
			eventDispatcher.addEventListener(ResourceEvent.ERROR, handleResourceNotLoaded);
		}

		public function changeLocale(locale:String):void {
<<<<<<< HEAD
			LOGGER.debug("Loading immediately " + locale);
			changeLocaleHelper(locale);
=======
			if (masterLocaleLoaded || locale == MASTER_LOCALE) {
				LOGGER.debug("Loading immediately {0}", [locale]);
				changeLocaleHelper(locale);
			} else {
				LOGGER.debug("Registering callback to load {0} later", [locale]);
				masterLocaleLoadedCallback = function():void {
					changeLocaleHelper(locale);
				}
			}
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
		}
		
		private function localeChangeComplete(event:ResourceEvent=null):void {
			// Set the preferred locale and master as backup.
			if (preferredLocale != MASTER_LOCALE) {
				ResourceManager.getInstance().localeChain = [preferredLocale, MASTER_LOCALE];
			} else {
<<<<<<< HEAD
				ResourceManager.getInstance().localeChain = [MASTER_LOCALE];
=======
				if (preferredLocale != MASTER_LOCALE) {
                    var logData:Object = UsersUtil.initLogData();
                    logData.tags = ["locale"];
                    logData.message = "Failed to load locale = " + preferredLocale;
					LOGGER.debug(JSON.stringify(logData));
				}
				masterLocaleLoaded = true;
				resourceManager.localeChain = [MASTER_LOCALE];
				preferredLocale = MASTER_LOCALE;
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
			}
			
			update();
		}
		
<<<<<<< HEAD
=======
		private function sendAppAndLocaleVersions():void {
			LOGGER.debug("Sending locale version");
			var dispatcher:Dispatcher = new Dispatcher();
			var versionEvent:AppVersionEvent = new AppVersionEvent();
			versionEvent.configLocaleVersion = false;
			dispatcher.dispatchEvent(versionEvent);			
		}

>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
		/**
		 * Defaults to DEFAULT_LANGUAGE when an error is thrown by the ResourceManager
		 * @param event
		 */
		private function handleResourceNotLoaded(event:ResourceEvent):void {
<<<<<<< HEAD
			LOGGER.debug("Resource locale [" + preferredLocale + "] could not be loaded.");
			
			if (preferredLocale != MASTER_LOCALE) {
				var logData:Object = UsersUtil.initLogData();
				logData.tags = ["locale"];
				logData.message = "Failed to load locale = " + preferredLocale;
				LOGGER.debug(JSON.stringify(logData));
			}
			
			ResourceManager.getInstance().localeChain = [MASTER_LOCALE];
=======
			LOGGER.debug("Resource locale {0} could not be loaded.", [preferredLocale]);
			resourceManager.localeChain = [MASTER_LOCALE];
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
			preferredLocale = MASTER_LOCALE;
			update();
		}
		
		public function update():void{
			reloadLocaleNames();
<<<<<<< HEAD
			if (!isInited()) {
				inited = true;
				dispatcher.dispatchEvent(new LocaleChangeEvent(LocaleChangeEvent.LOCALE_INIT));
			}
=======
      		sendAppAndLocaleVersions();
			updateLayoutDirection();
			var dispatcher:Dispatcher = new Dispatcher;
>>>>>>> b99cc7f413ab74828893e8cbdc82157136024ad5
			dispatcher.dispatchEvent(new LocaleChangeEvent(LocaleChangeEvent.LOCALE_CHANGED));
			dispatchEvent(new Event(Event.CHANGE));
		}
		
		public function updateLayoutDirection():void {
			if (isRTLEnabled()) {
				FlexGlobals.topLevelApplication.setStyle("layoutDirection", preferredDirection);
			}
		}
		
		[Bindable("change")]
		public function getString(resourceName:String, parameters:Array = null, locale:String = null):String{
			/**
			 * @fixme: to be reviewed when all locales from transifex are updated (gtriki feb 7, 2017)
			 * Get the translated string from the current locale. If empty, get the string from the master
			 * locale. Locale chaining isn't working because mygengo actually puts the key and empty value
			 * for untranslated strings into the locale file. So, when Flash does a lookup, it will see that
			 * the key is available in the locale and thus not bother falling back to the master locale.
			 *    (ralam dec 15, 2011).
			 */
			if (ResourceManager.getInstance().getObject(BBB_RESOURCE_BUNDLE, resourceName, locale) == undefined) {
				locale = MASTER_LOCALE;
			}

			var localeTxt:String = ResourceManager.getInstance().getString(BBB_RESOURCE_BUNDLE, resourceName, parameters, locale);
			if (locale != MASTER_LOCALE && StringUtils.isEmpty(localeTxt)) {
				localeTxt = ResourceManager.getInstance().getString(BBB_RESOURCE_BUNDLE, resourceName, parameters, MASTER_LOCALE);
			}
			return localeTxt;
		}
		
		public function getCurrentLanguageCode():String{
			return preferredLocale;
		}
		
		public function getCurrentLanguageDirection():String{
			return preferredDirection;
		}
				
		public function getCurrentLanguage():Object {
			return locales[getCurrentLanguageIndex()];
		}

		public function getCurrentLanguageIndex():int {
			return getIndexForLocale(preferredLocale);
		}
		
		public function isRTLEnabled() : Boolean {
			var languageOptions : LanguageOptions = Options.getOptions(LanguageOptions) as LanguageOptions;
			return languageOptions.rtlEnabled;
		}
	}
}

class SingletonEnforcer{}
