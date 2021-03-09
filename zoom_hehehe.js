(async function () {

const { SwitchItem, Category, ColorPickerInput, SliderInput } = settingsComponents
const { React, getModule, constants: { DEFAULT_ROLE_COLOR } } = browserCordWebpack
const { hex2int, int2hex } = getModule([ 'isValidHex' ], false);
const Dude ={
  "OPEN_IMAGE": "Open image",
  "COPY_IMAGE": "Copy image",
  "SAVE_IMAGE_AS": "Save Image As...",
  "IMAGE_SEARCH": "Search image in...",
  "HIDE_NATIVE_BUTTONS": "Hide native buttons",
  "HIDE_NATIVE_BUTTONS_NOTE": "Hide image buttons in messages context menu",
  "SHOW_WEBP": "Show WEBP extension",
  "RESIZE_IMAGES": "Resize images",
  "RESIZE_IMAGES_NOTE": "Increase the size of images in modals",
  "LENS_SETTINGS": "Lens settings",
  "LENS_BORDER_COLOR": "Lens border color",
  "LENS_BORDER_COLOR_NOTE": "The default is the interactive-hover color of your theme",
  "ZOOM_RATIO": "Zoom ratio",
  "ZOOM_RATIO_NOTE": "Magnifying the image in the lens",
  "LENS_RADIUS": "Lens radius",
  "REVERSE_SEARCH_IMAGES_SERVICES": "Reverse search images services",
  "DISABLE_LENS": "Disable lens",
  "IMAGE_COPIED": "Image copied",
  "IMAGE_LINK_COPIED": "Image link copied"
}

class Settings extends React.Component {
  render() {
    const {
      getSetting,
      toggleSetting,
      updateSetting
    } = this.props;
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(SwitchItem, {
      value: getSetting('hideNativeButtons', true),
      onChange: () => toggleSetting('hideNativeButtons', true),
      note: Dude.HIDE_NATIVE_BUTTONS_NOTE
    }, Dude.HIDE_NATIVE_BUTTONS), /*#__PURE__*/React.createElement(SwitchItem, {
      value: getSetting('patchImageSize', true),
      onChange: () => toggleSetting('patchImageSize', true),
      note: Dude.RESIZE_IMAGES_NOTE
    }, Dude.RESIZE_IMAGES), /*#__PURE__*/React.createElement(SwitchItem, {
      value: getSetting('enableWebp', false),
      onChange: () => toggleSetting('enableWebp', false)
    }, Dude.SHOW_WEBP), /*#__PURE__*/React.createElement(Category, {
      name: Dude.LENS_SETTINGS,
      opened: true,
      onChange: () => null
    }, /*#__PURE__*/React.createElement(ColorPickerInput, {
      value: hex2int(getSetting('lensColor', '000000')),
      onChange: v => updateSetting('lensColor', v === DEFAULT_ROLE_COLOR ? null : int2hex(v)),
      note: Dude.LENS_BORDER_COLOR_NOTE
    }, Dude.LENS_BORDER_COLOR), /*#__PURE__*/React.createElement(SliderInput, {
      stickToMarkers: true,
      keyboardStep: 1,
      markers: [1, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      onMarkerRender: e => `${e}x`,
      onValueChange: v => updateSetting('zoomRatio', v),
      defaultValue: getSetting('zoomRatio', 1.5),
      initialValue: getSetting('zoomRatio', 1.5),
      note: Dude.ZOOM_RATIO_NOTE
    }, Dude.ZOOM_RATIO), /*#__PURE__*/React.createElement(SliderInput, {
      stickToMarkers: true,
      keyboardStep: 1,
      markers: [50, 100, 200, 300, 400, 500],
      onMarkerRender: e => `${e}px`,
      onValueChange: v => updateSetting('lensRadius', v),
      defaultValue: getSetting('lensRadius', 200),
      initialValue: getSetting('lensRadius', 200),
      note: Dude.LENS_RADIUS_NOTE
    }, Dude.LENS_RADIUS)), /*#__PURE__*/React.createElement(Category, {
      name: Dude.REVERSE_SEARCH_IMAGES_SERVICES,
      opened: true,
      onChange: () => null
    }));
  }

}

;

settings.registerSettings('image-tools-settings', {
    category: "image-utils",
    label: 'Images Tools',
    render: Settings
  });

const setting_img = settings.buildCategoryObject('image-utils')
setting_img.set('lensRadius', 200)
setting_img.set('zoomRatio', 1.5)
//window.IMGTOOLS_setting = setting_img
class ImageWrapper extends React.Component {
    constructor(props) {
      super(props);
  
      this.getLensRadius = () => this.props.getSetting('lensRadius', 100);
  
      this.getZooming = () => this.props.getSetting('zoomRatio', 2);
  
      this.imgRef = React.createRef();
      this.baseLensStyle = {
        backgroundImage: `url(${this.props.children.props.src})`,
        borderColor: this.props.getSetting('lensColor', null)
      };
      this.state = {
        lensStyle: {
          backgroundPosition: null,
          backgroundSize: null,
          width: null,
          height: null,
          left: null,
          top: null
        },
        showLens: false
      };
      this.updatePos = this.updatePos.bind(this);
      this.onMouseDownUp = this.onMouseDownUp.bind(this);
    }
  
    updatePos(event) {
      const {
        clientX,
        clientY,
        pageX,
        pageY
      } = event;
      const img = this.imgRef.current.firstChild.firstChild;
      const rect = img.getBoundingClientRect();
  
      if (pageX < rect.left || pageX > rect.right || pageY < rect.top || pageY > rect.bottom) {
        this.setState({
          showLens: false
        });
        return;
      }
  
      const X = clientX - rect.left;
      const Y = clientY - rect.top;
      const lensRadius = this.getLensRadius();
      const zooming = this.getZooming();
      this.setState({
        lensStyle: {
          backgroundSize: `${img.offsetWidth * zooming}px ${img.offsetHeight * zooming}px`,
          backgroundPosition: `${lensRadius - X * zooming}px ${lensRadius - Y * zooming}px`,
          width: `${lensRadius * 2}px`,
          height: `${lensRadius * 2}px`,
          left: `${X - lensRadius}px`,
          top: `${Y - lensRadius}px`
        }
      });
    }
  
    onMouseDownUp(e) {
      if (e.button === 2) {
        return;
      }
  
      this.setState({
        showLens: e.type === 'mousedown'
      });
      this.updatePos(e);
      this.imgRef.current.click(); // do not interfere with other handlers
    }
  
    render() {
      return /*#__PURE__*/React.createElement(React.Fragment, null, this.state.showLens && /*#__PURE__*/React.createElement("div", {
        className: "image-tools-lens",
        style: { ...this.baseLensStyle,
          ...this.state.lensStyle
        },
        onMouseUp: this.onMouseDownUp,
        onMouseMove: this.updatePos
      }), /*#__PURE__*/React.createElement("div", {
        onMouseDown: this.onMouseDownUp,
        ref: this.imgRef
      }, this.props.children));
    }
  
  }
  
  ;


  var imageModal = function (args, res, setting_img2) {
    const patchImageSize = setting_img.get('patchImageSize', true);
  
    if (patchImageSize) {
      const imgComp = res.props.children[0].props;
      const { height, width } = imgComp;
      imgComp.height = height * 2;
      imgComp.width = width * 2;
      imgComp.maxHeight = 600;
      imgComp.maxWidth = 1200;
    }
  
    res.props.children.unshift(
      React.createElement(ImageWrapper, {
        children: res.props.children.shift(),
        getSetting: setting_img.get
      })
    );
    return res;
  };


  async function inject (funcPath, patch) {
    const path = funcPath.split('.');
    const moduleName = path.shift();
    //console.log(moduleName)
    const injectFunc = path.pop();
    const injectId = `image-tools${moduleName.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`;

    const module = await getModule((m) => m.default && m.default.displayName === moduleName, false);
    const injectTo = getModulePath(); // eslint-disable-line no-use-before-define

    injector.inject(injectId, injectTo, injectFunc, (...args) => patch(...args, this.settings));
    //this.uninjectIDs.push(injectId);
    module.default.displayName = moduleName;

    function getModulePath () {
      let obj = module;
      if (path.length) {
        for (let i = 0, n = path.length; i < n; ++i) {
          const k = path[i];
          if (k in obj) {
            obj = obj[k];
          } else {
            throw new Error(`Not found ${path.join('.')}.${injectFunc} in ${moduleName}`);
          }
        }
      }
      return obj;
    }
  }
  var message = function ([ { target } ], res, setting_imgf) {
    if (target.tagName.toLowerCase() === 'img') {
      const { width, height } = target;
      const menu = res.props.children;
      const urls = {
        png: target.src.split('?')[0]
      };
      const hideNativeButtons = setting_img.get('hideNativeButtons', true);
  
      if (hideNativeButtons) {
        for (let i = menu.length - 1; i >= 0; i -= 1) {
          const e = menu[i];
          if (Array.isArray(e.props.children)) {
            if (e.props.children[0].key === 'copy-image' || e.props.children[0].key === 'copy-native-link') {
              menu.splice(i, 1);
            }
          }
        }
      }
  
      menu.splice(
        3, 0, getButton(
          urls,
          {
            width: width * 2,
            height: height * 2
          },
          setting_img
        )
      );
    }
    return res;
  };
  
  await inject('ImageModal.default.prototype.render', imageModal);
  loadStylesheet(`.image-tools-lens {
    position: absolute;
    z-index: 1;
    background-repeat: no-repeat;
    border: 2px solid var(--interactive-hover);
    border-radius: 50%;
}
`)

})()
