Oskari.clazz.define('Oskari.coordinatetransformation.view.CoordinateSystemInformation', function (system) {
    this.system = system;
    this.loc = Oskari.getMsg.bind(null, 'coordinatetransformation');
}, {
    _template: {
        content: jQuery('<div class="oskari-coordinatesystem-info">' +
                        '<h4 class="info-description"></h4>' +
                        '<div class="info-content"></div>' +
                    '</div>'),
        list: jQuery('<ul class="info-list"></ul>'),
        listItem: jQuery('<li></li>'),
        paragraph: jQuery('<p></p>'),
        precisionTable: ({ title, unit, deg, rad, min, sec }) => `<div class="precision-table-wrapper">
                <h5 class="precision-table">${title}</h5>
                <table class="precisionTable">
                    <tr><th>${unit}</th><th>~1 m</th><th>~0.1 m</th><th>~1 cm</th><th>~1 mm</th><th>~0.1 mm</th></tr>
                    <tr><td>${deg}</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td></tr>
                    <tr><td>${rad}</td><td>7</td><td>8</td><td>9</td><td>10</td><td>11</td></tr>
                    <tr><td>${min}</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td></tr>
                    <tr><td>${sec}</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td></tr>
                </table>
            </div>`
    },
    setElement: function (el) {
        this.element = el;
    },
    getElement: function () {
        return this.element;
    },
    close: function () {
        if (this.dialog) {
            this.dialog.close(true);
        }
    },
    show: function (parentElement, key, skipInfo) {
        if (this.dialog) {
            this.dialog.close(true);
            this.dialog = null;
        }
        const title = this._getTitle(key);
        const content = this._createContent(key, skipInfo);
        const dialog = Oskari.clazz.create('Oskari.userinterface.component.Popup');
        const btn = dialog.createCloseButton(this.loc('actions.close'));
        btn.addClass('primary');
        dialog.createCloseIcon();
        // dialog.dialog.zIndex(parentElement.zIndex() + 1);
        dialog.show(title, content, [btn]);
        dialog.moveTo(parentElement);
        dialog.makeDraggable();

        this.dialog = dialog;
    },
    addPrecisionTable: function (toElem) {
        const headers = this.loc('infoPopup.decimalPrecision.precisionTable');
        const table = this._template.precisionTable(headers);
        toElem.append(table);
    },
    _createContent: function (key, skipInfo) {
        const me = this;
        const content = this._template.content.clone();
        const infoLoc = this.loc('infoPopup')[key];
        const infoContent = content.find('.info-content');
        content.find('.info-description').html(this.loc('infoPopup.description'));
        if (skipInfo !== true) {
            infoContent.html(infoLoc.info);
        }
        if (Array.isArray(infoLoc.paragraphs) && infoLoc.paragraphs.length !== 0) {
            infoLoc.paragraphs.forEach(function (item) {
                const paragraph = me._template.paragraph.clone();
                paragraph.text(item);
                infoContent.append(paragraph);
            });
        }
        if (Array.isArray(infoLoc.listItems) && infoLoc.listItems.length !== 0) {
            infoContent.append(this._createList(infoLoc.listItems));
        }
        if (key === 'decimalPrecision') {
            this.addPrecisionTable(infoContent);
        }
        return content;
    },
    _createList: function (list) {
        const me = this;
        const listElem = this._template.list.clone();
        list.forEach(function (item) {
            const listItem = me._template.listItem.clone();
            listItem.html(item);
            listElem.append(listItem);
        });
        return listElem;
    },
    _getTitle: function (key) {
        return this.loc('infoPopup')[key].title;
    }
}, {
});
