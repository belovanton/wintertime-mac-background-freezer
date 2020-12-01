const fs = require('fs').promises
const homedir = require('os').homedir()
const { name, version } = require( `${__dirname}/../package.json` )
const { block, unBlock, panicUnblockAll, say } = require( './process-management' )
const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron')
const fetch = require( 'electron-fetch' ).default


// WIndow management
const WindowListener = require( './events' )

class App {

  constructor() {

    // Backend functionality
    this.globalBlocklist = []
    this.defaultBlocklist = 'Google Chrome.*\nAdobe.*\nSafari.*\nMicrosoft.*\nMail\nFranz.*\nAffinity.*\nSublime Text.*\nBackup and sync.*'
    this.blocking = false
    this.debug = process.env.debug
    this.app = app
    this.currentWindow = new WindowListener( 500 )
    this.windowSize = { width: 400, height: 700 }
    this.rawRepo = 'https://raw.githubusercontent.com/actuallymentor/wintertime-mac-background-freezer/master/package.json'

    // Choices
    this.shortcut = 'Command+Shift+Space'

    // Initialisations
    this.configElectron()
    this.configIpc()
    this.configWindowcheck()
    this.checkUpdates( version )

    
  }

  toggleBlocking( ) {
    this.blocking = !this.blocking
  }

  configElectron() {
    // Application configs
    this.app.on( 'ready', f => {
      this.registerShortcuts()
      this.render()
    } )
    this.app.on( 'window-all-closed', f => {
      return panicUnblockAll()
      .then( f => {
        globalShortcut.unregisterAll()
        this.app.quit()
      } )
      
    } )
    this.app.on( 'activate', f => this.reload() )
  }

  registerShortcuts( ) {
    const registration = globalShortcut.register( this.shortcut, f => {

      // Tell interface to do action
      this.window.webContents.send( 'keyboard-shortcut', 'toggle-block' )

      // Shortcut sends signal, so the this.blocking = true means after full execution it is off
      //say( `Wintertime ${ this.blocking ? 'OFF' : 'ON' }` )
    } )
    if( process.env.debug ) console.log( globalShortcut.isRegistered( this.shortcut ), ' shortcut status ' )
  }

  configIpc() {
    // Event listeners
    ipcMain.on( 'restore-config', ( event, boolean ) => {

      if( this.debug ) console.log( 'Config restoration request received' )

      // Data inits
      return fs.readFile( `${ homedir }/Library/Application Support/${ name.toLowerCase() }/blocklist`, 'utf8' )
      .then( blocklist => {

        event.sender.send( 'restored-config-data', blocklist )
        this.globalBlocklist = blocklist.split( ',' )
        
      } )
      .catch( err => {

        // If the config file doesn't exist, return some defaults
        if( err.code == 'ENOENT' ) return event.sender.send( 'restored-config-data', this.defaultBlocklist )

        // if not, console
        if( this.debug ) console.log( 'File loading error ', err )

      } )
    } )

    // Start blocking
    ipcMain.on( 'block', ( event, blocklist ) => {

      if( this.debug ) console.log( 'Blocking start request received' )

      // Save text field to blocklist
      this.globalBlocklist = blocklist

      // Toggle on/off
      this.toggleBlocking()

      // If off restore all
      // Changed this.globalBlocklist.map( item => unBlock( item ) ) to panicunblock for simplicity
      if( !this.blocking ) panicUnblockAll()
      // If blocking, manually trigger window check 
      if( this.blocking ) this.currentWindow.checkWindow().then( currentApp => this.doBlocking( currentApp ) )

      // Save new data to config
      fs.writeFile( `${ homedir }/Library/Application Support/${ name.toLowerCase() }/blocklist`, this.globalBlocklist, 'utf8' )

    } )

    // Panic button ( CONT ev erything )
    ipcMain.on( 'panic', ( event, boolean ) => panicUnblockAll() )

  }

  configWindowcheck() {

    this.currentWindow.emitter.on( 'change', current => {
      if( this.debug ) console.log( 'Window changed to ', current )
      this.doBlocking( current )
    } )

  }

  doBlocking( current ) {
    if( this.debug ) console.log( 'Not blocking ', current )
    if( this.blocking && this.globalBlocklist ) this.globalBlocklist.map( item => current.match( item ) ? unBlock( item ) : block( item ) )
  }

  render() {

    // Create the window
    this.window = new BrowserWindow( {
      width: 400, 
      height: 700,
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: false
      }} )
    this.window.loadFile( `${ __dirname }/../src/index.html` )

    // Listeners
    this.window.on( 'closed', f => this.window = null )

    // If devving open inspector
    if( process.env.debug ) this.window.webContents.openDevTools( )

  }

  reload() {
    if( this.window == null ) this.init()
  }

  checkUpdates( version ) {
    return fetch( this.rawRepo )
    .then(res => res.json() )
    .then( json => {
      if( json.version > version ) {
        this.updateWindow = new BrowserWindow( { width: 400, height: 200 } )
        this.updateWindow.loadFile( `${ __dirname }/../src/update.html` )
        this.window.on( 'closed', f => this.updateWindow = null )
        if( process.env.debug ) this.updateWindow.webContents.openDevTools( )
      }
    } )
  }

}

if( this.debug ) this.timer = setInterval(function () {
  const activeWin = require('active-win')
  console.log(activeWin.sync());
}, 1000);

module.exports = new App()