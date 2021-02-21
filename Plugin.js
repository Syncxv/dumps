
class _Plugin {
  constructor(entityID) {
      this.settings = window.settings.buildCategoryObject(this.entityID);
      this.ready = false;
      this.styles = {};
      this.entityID = entityID
  }

  get isInternal() {
      return this.entityID.startsWith('bc-');
  }

  get color() {
      return '#7289da';
  }

  async loadStylesheet(cssOrLink) {
      if (cssOrLink.startsWith('https://')) {
          var css
          await fetch(cssOrLink, { method: "GET" }).then(resolve => resolve.text()).then(data => { css = data })
      } else {
          var css = cssOrLink
      }
      const id = Math.random().toString(36).slice(2);
      const style = document.createElement('style');
      style.id = `style-${this.entityID}-${id}`
      style.innerHTML = css
      document.head.appendChild(style);
      this.styles[id] = {css};
    
  }
  async _load () {
      try {
        if (typeof this.startPlugin === 'function') {
          await this.startPlugin();
        }
        this.log('Plugin loaded');
      } catch (e) {
        this.error('An error occurred during initialization!', e);
      } finally {
        this.ready = true;
      }
    }
  async _unload () {
      try {
        for (const id in this.styles) {
          document.getElementById(`style-${this.entityID}-${id}`).remove();
        }
  
        this.styles = {};
        if (typeof this.pluginWillUnload === 'function') {
          await this.pluginWillUnload();
        }
  
        this.log('Plugin unloaded');
      } catch (e) {
        this.error('An error occurred during shutting down! It\'s heavily recommended reloading Discord to ensure there are no conflicts.', e);
      } finally {
        this.ready = false;
      }
    }


    log (...data) {
      console.log(`%c[Plugin:${this.constructor.name}]`, `color: ${this.color}`, ...data);
    }
  
    debug (...data) {
      console.debug(`%c[Plugin:${this.constructor.name}]`, `color: ${this.color}`, ...data);
    }
  
    warn (...data) {
      console.warn(`%c[Plugin:${this.constructor.name}]`, `color: ${this.color}`, ...data);
    }
  
    error (...data) {
      console.error(`%c[Plugin:${this.constructor.name}]`, `color: ${this.color}`, ...data);
    }
}
window._Plugin = _Plugin
