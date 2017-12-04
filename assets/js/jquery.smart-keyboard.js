(function($) {
    var props = {
        "keypad": true,
        "numpad": true,
        "numpadcol" : 3,
        "animation": true,
        "distance": 30,
        "buttonWidth":"27px",
        "skinClass":"numpadblue",
        "position": 0 // 0 - right, 1 - bottom, 2 - left, 3 - top
        
    };
    /**
    * Birim layout'u parse eder, sarmalar ve gerekli fonksiyonları bindirir.
    *
    * @class Parse edilmiş layout
    */
    function ParsedLayout(layout) {
        // layout içinde alfabetik karakterler tanımlıysa
        // bunları karakter dizisine çevirir
        if (layout.alphaset) {
            this.alphaset = [];
            this.alphaset.push(layout.alphaset[0].split(""));
            this.alphaset.push(layout.alphaset[1].split(""));
        }

        // layout içinde numerik karakterler tanımlıysa
        // bunları karakter dizisine çevirir
        if (layout.numericset) {
            this.numericset = layout.numericset.split("");
        }

        /**
        * Şuanki parse edilmiş layout'un bir kopyasını oluşturur.
        * 
        * @returns {ParsedLayout}
        */
        this.clone = function() {
            return new ParsedLayout(layout);
        };
    }

    /**
    * Dizi halindeki layout u {ParsedLayout} class'a parse ettirir ve kendi üzerinde grup halinde tutar.
    * 
    *
    * @class Parse edilmiş layout grubu
    */
    function LayoutStack(stack) {
        var _parsedLayouts = {}; // stack ile gelen parse edilmiş tüm layoutlar
        var _activeLayout; // seçilmiş layout un ismi

        /**
        * Gönderilen layout'u verilen isme göre depo eder
        * 
        * @param {String} name Daha sonra layout'a erişebilmek için etiketlenmiş bir isim.
        * @param {ParsedLayout} layout 
        */
        this.holdLayout = function(name, layout) {
            _parsedLayouts[name] = layout;
        };

        /**
        * Daha önce bir etiket isim ile depolanmış layout'u getirir.
        * 
        * @param {String} name Erişilmek istenilen layout ismi.
        * @returns {ParsedLayout}
        */
        this.getLayout = function(name) {
            return _parsedLayouts[name];
        };

        /**
        * İşlennmemiş layout dizisindeki layoutları ayırır ve {ParsedLayout} a parse ettirir.
        * 
        * @param {Array} stack İşlenmemiş layout dizisi
        */
        this.splitStack = function(stack) {
            for (var item in stack) { // layout dizisindeki tüm layoutları geziyor
                this.holdLayout(item, new ParsedLayout(stack[item])); // parse edip kendi üzerinde tutuyor
            }
        };
        this.splitStack(stack);

        /**
        * Layout grubu içerisinde isim vererek aktif layout'u seçer.
        * 
        * @param {String} name Seçilecek layout'un adı.
        */
        this.setCurrentLayout = function(name) {
            if (_parsedLayouts[name]) { // parse edilmiş layoutlarda varsa ...
                _activeLayout = name; // aktif layout olarak tanımla.
            } else {
                throw new Error("Parse edilmemiş bir layout aktif edilemez.");
            }
        };

        /**
        * Daha önce seçilmiş aktif layout'u verir.
        * 
        * @returns {ParsedLayout}
        */
        this.getCurrentLayout = function() {
            return _parsedLayouts[_activeLayout];
        };

        /**
        * Daha önce seçilmiş aktif layout'un adını verir.
        * 
        * @returns {String}
        */
        this.getCurrentLayoutName = function() {
            return _activeLayout;
        };

    }

    Keyboard.LOWER_CASE = 0;
    Keyboard.UPPER_CASE = 1;

    /**
    *
    * @class temel klavye işlemlerini oluşturur
    */
    function Keyboard(layouts) {
        this._capsLockState = Keyboard.LOWER_CASE; // default CAPS LOCK durumunu tutar
        this.shuffleState = false; // toogleShuffle'ın şuanki durumunu tutar
        this.control = null; // keyboard'ın gösterildiği input kontrolü

        this._layoutStack = new LayoutStack(layouts); // ham şekilde verilen layout dizisini hazırlar
        var _prevLayout; // bir önceki set edilen layout'u tutucak

        /**
        * Öncesi ve sonrası ilişkisini koruyarak {LayoutStack} içerisindeki bir layout'u aktif eder
        * 
        * @param {String} layoutName Parse edilen layoutları tutan {LayoutStack} içerisindeki bir layout'un ismi
        */
        this.setCurrentLayout = function(layoutName) {
            this._layoutStack.setCurrentLayout(layoutName);
            _prevLayout = layoutName;
        };

        /**
        * Aktif layout'un alfanumerik karakterlerin aktif CAPS'ini geri döndürür
        * @returns {Array}
        */
        this.getCurrentKeypad = function() {
            return this._layoutStack.getCurrentLayout().alphaset[this._capsLockState];
        };

        /**
        * Aktif layout'un numerik karakterlerini döndürür
        * @returns {Array}
        */
        this.getCurrentNumpad = function() {
            return this._layoutStack.getCurrentLayout().numericset;
        };
    }


    Keyboard.prototype = {
        /**
        * CAPS_LOCK state i upper case olarak ayarlar ve önyüz görüntüsünü yeniler
        */
        "upperCase": function() {
            if (this._capsLockState != Keyboard.UPPER_CASE) {
                this._capsLockState = Keyboard.UPPER_CASE;
                this.refreshView();
            }
        },
        /**
        * CAPS_LOCK state i lower case olarak ayarlar ve önyüz görüntüsünü yeniler
        */
        "lowerCase": function() {
            if (this._capsLockState != Keyboard.LOWER_CASE) {
                this._capsLockState = Keyboard.LOWER_CASE;
                this.refreshView();
            }
        },
        /**
        * CAPS_LOCK state i olduğunun tersi olarak ayarlar ve önyüz görüntüsünü yeniler
        */
        "toggleCase": function() {
            switch (this._capsLockState) {
                case Keyboard.LOWER_CASE:
                    this._capsLockState = Keyboard.UPPER_CASE;
                    break;
                case Keyboard.UPPER_CASE:
                    this._capsLockState = Keyboard.LOWER_CASE;
            }
            this.refreshView();
        },
        /**
        * Klavye fonksiyonlarının ilişkili olduğu önyüz görüntüsünü yeniler
        */
        "refreshView": function() {
            this.view.refresh();
        },
        /**
        * Gönderilen karakteri aktif input kontrolüne ekler.
        * Eğer shuffleState == true ise aktif layout'u karışık olarak ayarlar
        * 
        * @param {String} key gönderilen karakter
        */
        "sendKey": function(key) {
			var maxLength = this.control.getAttribute('maxlength');
			if(maxLength === null) {
				this.control.value += key;
                $(this.control).keyup();
			}
			else {
				if (maxLength > this.control.value.length + 1) {
					this.control.value += key;
                    $(this.control).keyup();
                }
				else {
                    if(maxLength > this.control.value.length) {
                        this.control.value += key;
                        $(this.control).keyup();
                    }
                    if ($(this.control).attr("touch")) {
                        this.close();
                    } else {
//                        this.tab();
                    }
				}
			}
            if (this.shuffleState) this.shuffle();
        },
        /**
        * Aktif kontroldeki karakterleri birer birer siler
        */
        "backspace": function() {
            var val = this.control.value;
            this.control.value = val.substr(0, val.length - 1);
            $(this.control).keyup();
        },
        /**
        * 
        */
        "enter": function() {
            this.control.value += "\r";
        },
        /**
        * 
        */
        "close": function() {
            this.view.hide();
        },
        /**
        * Daha önce aktiflenen bir layout tekrardan aktiflenmiyorsa, onu aktifler ve 
        * önyüz görünütüsünü tazeler
        * 
        * @param {String} layoutName Parse edilen layoutları tutan {LayoutStack} içerisindeki bir layout'un ismi
        */
        "changeLayout": function(layoutName) {
            // daha önce seçilmiş layout ile seçilmek istenilen aynı değilse...
            if (this._layoutStack.getCurrentLayoutName() != layoutName) {
                this.setCurrentLayout(layoutName); // verilen layout adını şimdiki layout olarak belire
                this.refreshView(); // ön yüzdeki görüntüyü yenile
            }
        },
        /**
        * 
        */
        "toggleShuffle": function(b) {
            this.shuffleState = !this.shuffleState;
            if (this.shuffleState) {
                $(b).find("span").text("Sabit");
                this.shuffle();
            } else {
                $(b).find("span").text("Hareketli");
                this.changeLayout("turkish_Q");
            }
        },
        /**
        * 
        */
        "clear": function() {
            this.control.value = "";
        },
        /**
        * 
        */
        "tab": function() {
            var i = this.controls.index(this.control) + 1;
            if (i >= this.controls.length) {
                i = 0;
                this.close();
            }else{
                this.controls.eq(i).focus();
            }
        },
        /**
        * Seçilmiş layout'dan yola çıkarak yeni bir shuffle layout kopyalar eğer daha önce kopyalanmamışsa
        * Daha sonrasında bu layout'u aktif eder ve önyüz görünümünü yeniler
        */
        "shuffle": function() {
            var layoutName = this._layoutStack.getCurrentLayoutName(); // şimdiki klavye adını alır

            if (layoutName.substr(layoutName.length - 2) != "_s") { // şimdiki layout shuffle edilen değilse
                layoutName += "_s"; // shuffle edilen layout ismi için ek getirilir
            }

            // mevcut layoutlar içerisinden shuffle edilen layout alınmaya çalışılır
            var targetLayout = this._layoutStack.getLayout(layoutName);

            if (!targetLayout) { // shuffe edilen layout mevcut değilse
                targetLayout = this._layoutStack.getCurrentLayout().clone(); // shuffle edilmeyen mevcut layout'dan kopya alınır
                this._layoutStack.holdLayout(layoutName, targetLayout); // shuffle edilen olarak kaydedilir
            }

            var samplePattern = []; // büyük küçük karışık harflerin eşleşmesi için sıralama deseni tutulacak

            targetLayout.numericset.sort(function() { // numerik değerleri karıştırıyor
                return Math.pow(-1, Math.round(Math.random() + 1));
            });
            targetLayout.alphaset[0].sort(function() { // alfanumerik LOWER_CASE değerleri karıştırıyor
                var n = Math.pow(-1, Math.round(Math.random() + 1)); // 1 veya -1 olmak üzere rastgele değer üretiyor
                samplePattern.unshift(n); // diğer CAPS'leri aynı şekilde sıralamak için depo ediliyor
                return n;
            });
            targetLayout.alphaset[1].sort(function() { // alfanumerik UPPER_CASE değerleri karışıtırıyor
                return samplePattern.pop(); // daha önce LOWER_CASE için kullanılan sıralama pattern'i kullanıyor
            });

            this.setCurrentLayout(layoutName); // hazırlanmış karışık layout'u aktif eder
            this.refreshView(); // önyüz görünümünü yeniler
        }
    };

    /**
    * 
    * @class görünümü oluşturur
    * 
    */
    function KeyboardView(keyboard) {

        if (keyboard.view) {
            return keyboard.view;
        } else {
            this.keyboard = keyboard;
            keyboard.view = this;
        }

        var _viewNodeCreators = {};
        var _viewNodes = {};
        var _refreshCallback = function() { };
        var _isVisible = false;

        this.animation = false;
        this.position = 0;
        this.distance = 30;

        this.addNodeCreator = function(name, callback) {
            _viewNodeCreators[name] = callback;
        };

        /**
        * 
        */
        this.createNode = function(name) {
            var args = Array.prototype.slice.call(arguments, 1);
            return _viewNodes[name] = _viewNodeCreators[name].apply(this, args);
        };

        /**
        * 
        */
        this.getNode = function(name) {
            return _viewNodes[name] || this.createNode(name);
        };

        /**
        * 
        */
        this.refresh = function(callback) {
            if (callback) {
                if (typeof callback == "function") {
                    _refreshCallback = callback;
                }
            } else {
                _refreshCallback.call(this, arguments);
            }
        };

        /**
        * 
        */
        this.show = function(e) {
        	
        	/*
        	 * @author Yarkın ÜÇERLER
        	 * @date 29.11.2017
        	 * 
        	 * Conditioned for responsive design.
        	 * Smart Keyboard is closed when window size small from 768px.
        	 * 
        	 */
        	if($(window).width() < 768) {
        		return;
        	}

            var kb = this.getNode("keyboard");
            var kc = this.keyboard.control;
            var of = $(this.keyboard.control).offset();

            var left = 0;
            var top = 0;
            switch (this.position) {
                case 0:
                    top = of.top;
                    left = of.left + this.distance + kc.offsetWidth;
                    break;
                case 1:
                    top = of.top + this.distance + kc.offsetHeight;
                    left = of.left;
                    break;
                case 2:
                    top = of.top;
                    left = of.left - this.distance - kb.innerWidth();
                    break;
                case 3:
                    top = of.top - this.distance - kb.innerHeight();
                    left = of.left;
                    break;
            }

            if (!_isVisible) {
                kb.css({
                    left: left,
                    top: top
                });

                if (this.animation) {
                    kb.fadeIn(250);
                } else {
                    kb.show();
                }
                _isVisible = true;
            } else {
                if (this.animation) {
                    kb.animate({
                        left: left,
                        top: top
                    });
                } else {
                    kb.css({
                        left: left,
                        top: top
                    });
                }
            }
        };

        /**
        * 
        */
        this.hide = function(e) {
            if (_isVisible) {
                if (this.animation) {
                    this.getNode("keyboard").fadeOut(250);
                } else {
                    this.getNode("keyboard").hide();
                }

                _isVisible = false;
            }
        };
    }

    var layouts = {
        "turkish_Q": {
            "alphaset": ["qwertyuıopğüasdfghjklşi-_zxcvbnmöç.",
							"QWERTYUIOPĞÜASDFGHJKLŞİ-_ZXCVBNMÖÇ."],
            "numericset": "7890345612"
        },
        "turkish_F": {
            "alphaset": ["fgğıodrnhpqwxuieaütkmly-_şjövcçzsb.",
							"FGĞIODRNHPQWXUİEAÜTKMLY-_ŞJÖVCÇZSB."],
            "numericset": "7894561230"
        },
        "turkish_ordered": {
            "alphaset": ["abcçdefgğhıijklmnoöpqrs-_ştuüvwxyz.",
					    	"ABCÇDEFGĞHIİJKLMNOÖPQRS-_ŞTUÜVWXYZ."],
            "numericset": "1234567890"
        }
    };

    var keyboard = new Keyboard(layouts);
    keyboard.setCurrentLayout("turkish_Q");
    window.keyboard = keyboard;

    $(function() {
        var _numpadNode = "";
        var keyboardView = new KeyboardView(keyboard);

        /* -- CONFIGURABLE AREA: view templates -- */
        var keyboardFieldClass = "";
        keyboardView.addNodeCreator("keyboard", function(props) {
            keyboardFieldClass = (this.keypad == true) ? keyboardFieldClass + " has-keypad" : keyboardFieldClass + "";
            keyboardFieldClass = (this.numpad == true) ? keyboardFieldClass + " has-numpad" : keyboardFieldClass + "";
            keyboardFieldClass = (this.numpad == true && this.keypad == true) ? "has-allpad" : keyboardFieldClass + "";
            //console.log(props.skinClass)
            var _keyboardNode = $('<div id="mc-keyboard" class="' + props.skinClass +" "+ keyboardFieldClass + '"></div>');
            if (this.keypad == true) {
                var _left = $('<div class="mc-keyboard-left"><span class="close-keyboard"></span></div>').appendTo(_keyboardNode);
                _left.append(this.createNode("state"));
                _left.append(this.createNode("keypad"));
            }
            if (this.numpad == true) {
                var _right = $('<div class="mc-keyboard-right"><span class="close-keyboard"></span></div>').appendTo(_keyboardNode);
                _right.append(this.createNode("numpad"));
                _right.append(this.createNode("numpadstate"));
            }
            return _keyboardNode;
        });

        keyboardView.addNodeCreator("keypad", function() {
            var _keypadNode = $('<div id="mc-keypad"></div>');
            var keyCol = this.keyboard.getCurrentKeypad();
            var _row;

            for (var key in keyCol) {
                if (key == 0 || key == 12 || key == 24) {
                    _row = $('<div class="mc-keyboard-row"></div>').appendTo(_keypadNode);
                }
                _row.append(this.createNode("button", keyCol[key], "width:"+this.buttonWidth, "keyboard.sendKey('" + keyCol[key] + "')"));
            }

            return _keypadNode;
        });

        keyboardView.addNodeCreator("numpad", function() {
            _numpadNode = $('<div id="mc-numpad"></div>');
            var _numCol = this.keyboard.getCurrentNumpad();
            var _row;

            for (var num in _numCol) {
                if ((num % this.numpadcol) == 0) {
                    _row = $('<div class="mc-keyboard-row"></div>').appendTo(_numpadNode);
                }

                _row.append(this.createNode("button", _numCol[num], "width:"+this.buttonWidth, "keyboard.sendKey('" + _numCol[num] + "')"));
            }
            if(this.keypad == false){
                _row.append(this.createNode("button", "Tab", "", "keyboard.tab()"));
                _row.append(this.createNode("button", "Sil", "", "keyboard.backspace()","btn-sil"));
                _numpadNode.append(this.createNode("button", "Hareketli", "", "keyboard.toggleShuffle(this)","btn-hareketli"));
            }
            return _numpadNode;
        });

        keyboardView.addNodeCreator("button", function(value, style, href, additional_class) {
            var extra_class = (additional_class!=null && additional_class!= undefined)?additional_class:"";
            var _buttonView = '<a class="mc-keyboard-button '+extra_class+'" style="' + style + '" href="" onclick="' + href + ';return false;">' +
			'<span>' + value + '</span>' +
			'</a>';
            return $(_buttonView);
        });
        
		
        keyboardView.addNodeCreator("numpadstate",function(_numpadNode) {
           	_numpadStateNode = $('<div id="mc-numpad-state"></div>');
            _numpadStateNode.append(this.createNode("button", "Tab", "", "keyboard.tab()",'btn-tab'))
            _numpadStateNode.append(this.createNode("button", "Sil", "", "keyboard.backspace()","btn-sil"))
            _numpadStateNode.append(this.createNode("button", "Hareketli", "", "keyboard.toggleShuffle(this)","btn-hareketli"));
            return _numpadStateNode;
        });

        keyboardView.addNodeCreator("state", function() {
            var _stateView = $('<div id="mc-state" class="mc-keyboard-row"></div>');
            _stateView.append(this.createNode("button", "TAB", "width:40px;", "keyboard.tab()"));
            _stateView.append(this.createNode("button", "SİL", "width:40px;", "keyboard.clear()"));
            _stateView.append(this.createNode("button", "BÜYÜK HARF", "width:80px;", "keyboard.upperCase()"));
            _stateView.append(this.createNode("button", "KÜÇÜK HARF", "width:80px;", "keyboard.lowerCase()"));
            _stateView.append(this.createNode("button", "HAREKETLİ", "width:80px;", "keyboard.toggleShuffle(this)"));
            return _stateView;
        });

        keyboardView.refresh(function() {
            this.getNode("keypad").replaceWith(this.createNode("keypad"));
            this.getNode("numpad").replaceWith(this.createNode("numpad"));
            $(".mc-keyboard-button span").mouseup(function(){
              $(this).removeClass("btn-keyboard-active");
            }).mousedown(function(){
              $(this).addClass("btn-keyboard-active");
            });
        });

        /* -- CONFIGURABLE AREA: view templates -- */

        $.fn.keyboard = function(props) {
            props = jQuery.extend(props, props);
            //console.log(props.skinClass + "-plug")
            /* handling properties */
            keyboardView.animation = props.animation;
            keyboardView.position = props.position;
            keyboardView.distance = props.distance;
            keyboardView.keypad = props.keypad;
            keyboardView.numpad = props.numpad;
            keyboardView.numpadcol = props.numpadcol;
            keyboardView.skinClass = props.skinClass;

            //console.dir(keyboardView);
            /* handling properties */
            var items = this.filter("input[type=text],input[type=password]");
            var kbNode = keyboardView.createNode("keyboard",props);
            $("body").append(kbNode);

            keyboard.controls = items;

            items.focus(function(e) {
                keyboard.control = this;
                keyboard.view.show(e);
            });

            $(document).click(function(e) {
                keyboard.view.hide();
            });

            $(window).bind("load resize", function () {
                if (keyboard.control) {
                    keyboard.view.animation = false;
                    keyboard.view.show();
                    keyboard.view.animation = true;
                }
            });

            kbNode.click(function(e) { e.stopPropagation(); });
            items.click(function(e) { e.stopPropagation(); });

            return this;
        };

    });

})(jQuery);