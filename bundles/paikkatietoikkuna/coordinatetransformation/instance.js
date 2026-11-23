import React from 'react';
import { NavigationAdapter } from 'oskari-ui/util/NavigationAdapter';
import { showFlyout } from 'oskari-ui/components/window';
import { styled } from 'styled-components';
import './Flyout.js';
import { MAP, ID_PREFIX } from './constants';
import { coordinateToMarker } from './helper';
import { ViewHandler } from './handler/ViewHandler';
import { FlyoutView } from './view/FlyoutContent';

const FLYOUT_ID = 'CoordinateTransformation';
const FlyoutPadding = styled('div')`
    margin: 0;
    padding: 1.5em 1.5em 1.5em 1.75em;
`;

Oskari.clazz.define('Oskari.coordinatetransformation.instance',
    function () {
        this.defaultConf.name = 'coordinatetransformation';
        this.defaultConf.flyoutClazz = 'Oskari.coordinatetransformation.Flyout';
        this.loc = Oskari.getMsg.bind(null, 'coordinatetransformation');
        this.mapSelection = null;
        this.tempCoords = []; // {id, x, y, ?label?}
        this.sandbox = Oskari.getSandbox();
        this.handler = null;
        this.keepStateOnClose = false;
        this.mainNavigationControls = null;
        this.navigation = new NavigationAdapter(this, {
            createMenuItem: (navigation) => this.createMenuItem(navigation),
            onStart: () => {
                this.handler = new ViewHandler(this, this.loc, this.getConfiguration());
                this.handler.addStateListener(() => this.updateMainNavigationFlyout());
            },
            onStop: () => {
                this.closeMainNavigationFlyout();
                this.handler = null;
            }
        });
    }, {
        __name: 'coordinatetransformation',
        getName: function () {
            return this.__name;
        },
        getFlyout: function () {
            return this.plugins['Oskari.userinterface.Flyout'];
        },
        start: function () {
            const conf = this.getConfiguration();
            const sandbox = Oskari.getSandbox(conf.sandbox || 'sandbox');
            this.sandbox = sandbox;
            sandbox.register(this);
            if (conf.stateful === true) {
                sandbox.registerAsStateful(this.mediator.bundleId, this);
            }
            this.navigation.start();
            this.afterStart(sandbox);
        },
        afterStart: function (sandbox) {
            if (!this.navigation.service) {
                return;
            }
            Object.keys(this.eventHandlers)
                .forEach((eventName) => sandbox.registerForEventByName(this, eventName));
        },
        stop: function () {
            const sandbox = this.sandbox;
            const usingMainNavigation = !!this.navigation.service;
            const result = this.navigation.stop();
            if (this.navigation.service) {
                return result;
            }
            if (usingMainNavigation) {
                Object.keys(this.eventHandlers)
                    .forEach((eventName) => sandbox.unregisterFromEventByName(this, eventName));
            }
            sandbox.unregisterStateful(this.mediator.bundleId);
            sandbox.unregister(this);
            this.sandbox = null;
            this.started = false;
        },
        createMenuItem: function ({ MenuItem, MenuItemActivationResult }) {
            const menuItem = new MenuItem({
                bundleId: this.mediator.bundleId,
                sortOrder: 100,
                name: this.getTitle(),
                tooltip: this.getDescription(),
                setActive: (isActive) => {
                    if (isActive) {
                        const opened = this.showMainNavigationFlyout(() => menuItem.onClose?.(menuItem.getMenuItemId()));
                        return opened ? MenuItemActivationResult.OK : MenuItemActivationResult.FAILED;
                    }
                    this.closeMainNavigationFlyout();
                    return MenuItemActivationResult.OK;
                }
            });
            return menuItem;
        },
        showMainNavigationFlyout: function (onClose) {
            if (this.mainNavigationControls) {
                return true;
            }
            const controls = showFlyout(this.getTitle(), this.getPaddedFlyoutContent(), () => {
                if (this.mainNavigationControls !== controls) {
                    return;
                }
                this.mainNavigationControls = null;
                this.onMainNavigationFlyoutClosed();
                onClose();
            }, { id: FLYOUT_ID });
            if (!controls) {
                return false;
            }
            this.mainNavigationControls = controls;
            this.sandbox.postRequestByName('DisableMapKeyboardMovementRequest');
            return true;
        },
        closeMainNavigationFlyout: function () {
            const controls = this.mainNavigationControls;
            this.mainNavigationControls = null;
            controls?.close();
            if (controls) {
                this.onMainNavigationFlyoutClosed();
            }
        },
        onMainNavigationFlyoutClosed: function () {
            if (!this.keepStateOnClose) {
                this.handler?.onFlyoutClose();
            }
            this.sandbox.postRequestByName('EnableMapKeyboardMovementRequest');
        },
        getPaddedFlyoutContent: function () {
            return (
                <FlyoutPadding>
                    <FlyoutView
                        state={this.handler.getState()}
                        controller={this.handler.getController()}/>
                </FlyoutPadding>
            );
        },
        updateMainNavigationFlyout: function () {
            this.mainNavigationControls?.update(this.getTitle(), this.getPaddedFlyoutContent());
        },
        toggleFlyout: function (visible) {
            if (this.navigation.service) {
                this.keepStateOnClose = !visible;
                this.navigation.service.setActive(this.navigation.menuItem.getMenuItemId(), visible);
                this.keepStateOnClose = false;
                return;
            }
            const mode = visible ? 'attach' : 'hide';
            this.sandbox.postRequestByName('userinterface.UpdateExtensionRequest', [this, mode]);
        },
        setMapSelectionMode: function (mode) {
            const stopped = !mode;
            this.sandbox.postRequestByName('MapModulePlugin.GetFeatureInfoActivationRequest', [stopped]);
            if (stopped) {
                this.setMapCoordinates([]);
            }
            this.mapSelection = mode;
        },
        getMapCoordinates: function () {
            // remove id
            return this.tempCoords.map(({ x, y, z }) => ({ x, y, z }));
        },
        setMapCoordinates: function (coords) {
            // Remove previous
            this.tempCoords.forEach(({ id }) => this.sandbox.postRequestByName('MapModulePlugin.RemoveMarkersRequest', [id]));
            this.tempCoords = [];

            this.tempCoords = coords.map(coord => ({ ...coord, id: ID_PREFIX + Oskari.getSeq(this.getName()).nextVal() }));
            this.tempCoords.forEach(coord => {
                const marker = coordinateToMarker(coord);
                this.sandbox.postRequestByName('MapModulePlugin.AddMarkerRequest', [marker, coord.id]);
            });
        },
        eventHandlers: {
            'MapClickedEvent': function (event) {
                if (this.mapSelection !== MAP.ADD) {
                    return;
                }
                const { lon, lat } = event.getLonLat();
                // This assumes lon first (3067)
                const coord = {
                    x: parseInt(lon),
                    y: parseInt(lat),
                    z: 0,
                    id: ID_PREFIX + Oskari.getSeq(this.getName()).nextVal()
                };
                this.tempCoords.push(coord);
                const marker = coordinateToMarker(coord, true);
                this.sandbox.postRequestByName('MapModulePlugin.AddMarkerRequest', [marker, coord.id]);
            },
            'MarkerClickEvent': function (event) {
                if (this.mapSelection !== MAP.REMOVE) {
                    return;
                }
                const id = event.getID();
                if (!id.startsWith(ID_PREFIX)) {
                    return;
                }
                this.tempCoords = this.tempCoords.filter(coord => coord.id !== id);
                // TODO: add some check that we remove only own markers => id starts with prefix etc
                this.sandbox.postRequestByName('MapModulePlugin.RemoveMarkersRequest', [id]);
            },
            'userinterface.ExtensionUpdatedEvent': function (event) {
                if (this.navigation.service || event.getExtension().getName() !== this.getName()) {
                    return;
                }
                const state = event.getViewState();
                if (state === 'attach') {
                    this.getFlyout().setContainerMaxHeight(Oskari.getSandbox().getMap().getHeight());
                    this.sandbox.postRequestByName('DisableMapKeyboardMovementRequest');
                } else if (state === 'close') {
                    this.getFlyout().teardown();
                    this.sandbox.postRequestByName('EnableMapKeyboardMovementRequest');
                } else if (state === 'hide') {
                    this.sandbox.postRequestByName('EnableMapKeyboardMovementRequest');
                }
            },
            'MapSizeChangedEvent': function (event) {
                if (this.navigation.service) {
                    return;
                }
                this.getFlyout().setContainerMaxHeight(event.getHeight());
            }
        }
    }, {
        /**
         * @property {String[]} protocol
         * @static
         */
        extend: ['Oskari.userinterface.extension.DefaultExtension'],
        protocol: ['Oskari.bundle.BundleInstance', 'Oskari.mapframework.module.Module']
    });
