import { Edge, PositionedNode } from '@/graph-lib';
import { configureStore, EnhancedStore, Unsubscribe } from '@reduxjs/toolkit';
import { Component } from 'react';
import { Provider } from 'react-redux';
import { ZOOM_FACTOR } from './components/defaults';
import { Defs } from './components/defs/Defs';
import EdgesGroup from './components/groups/EdgesGroup';
import NodesGroup from './components/groups/NodesGroup';
import { GraphGroupProps } from './GraphGroupProps';
import { Gesture } from './middleware/mouse/gesture';
import {
  mouseDowned,
  MouseMiddleware,
  mouseMiddleware,
  mouseMoved,
  mouseUpped,
  mouseWheeled,
  spreadTargetSet
} from './middleware/mouse/middleware';
import { createGraphState } from './store/graph/graph';
import graphReducer, { graphChanged } from './store/graph/graphSlice';
import { createLabelsState } from './store/labels/labels';
import labelsReducer, {
  edgeLabelsChanged,
  nodeLabelsChanged
} from './store/labels/labelsSlice';
import { createPathsState } from './store/paths/paths';
import pathsReducer, {
  defaultPathChanged,
  pathsChanged
} from './store/paths/pathsSlice';
import { createSelectionState } from './store/selection/selection';
import selectionReducer from './store/selection/selectionSlice';
import { createShapesState } from './store/shapes/shapes';
import shapesReducer, {
  defaultShapeChanged,
  shapesChanged
} from './store/shapes/shapesSlice';
import { RootState } from './store/store';
import { createStylesState } from './store/styles/styles';
import stylesReducer, {
  edgeStyleDefaultsChanged,
  edgeStyleDefsChanged,
  nodeStyleDefaultsChanged,
  nodeStyleDefsChanged,
  waypointStyleChanged
} from './store/styles/stylesSlice';
import { graphSubscription } from './subscribers/graphSubscription';
import { selectionSubscription } from './subscribers/selectionSubscription';
import { typedMemo } from './utilities/typedMemo';

class GraphGroup<N extends PositionedNode, E extends Edge> extends Component<
  GraphGroupProps<N, E>
> {
  private readonly store: EnhancedStore<RootState>;
  private readonly gesture: Gesture;
  private readonly mouse: MouseMiddleware;

  private unsubscribeGraphUpdate: Unsubscribe | undefined;
  private unsubscribeSelectionUpdate: Unsubscribe | undefined;

  constructor(props: GraphGroupProps<N, E>) {
    super(props);

    // @ts-ignore
    const isDev = process.env.NODE_ENV === 'development';

    this.gesture = new Gesture(props.svg, props.zoomScaleFactor || ZOOM_FACTOR);
    this.mouse = mouseMiddleware(props, this.gesture);

    this.store = configureStore({
      reducer: {
        graph: graphReducer,
        labels: labelsReducer,
        paths: pathsReducer,
        selection: selectionReducer,
        shapes: shapesReducer,
        styles: stylesReducer
      },
      preloadedState: this._initializePreloadedState(props),
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          immutableCheck: isDev,
          serializableCheck: isDev
        }).prepend(this.mouse),
      devTools: isDev
    });

    this.unsubscribeGraphUpdate = graphSubscription(this.store, props);
    this.unsubscribeSelectionUpdate = selectionSubscription(this.store, props);
  }

  componentDidMount() {
    this.props.svg.addEventListener('mousedown', this._onMouseDown);
    this.props.svg.addEventListener('mousemove', this._onMouseMove);
    this.props.svg.addEventListener('mouseup', this._onMouseUp);
    this.props.svg.addEventListener('wheel', this._onMouseWheel);
  }

  componentDidUpdate(prevProps: Readonly<GraphGroupProps<N, E>>) {
    const prev = prevProps;
    const props = this.props;
    const state = this.store.getState();

    this._updateGraph(prev, props);

    this._updateCallbacks(prev, props);
    this._updateDefaultPath(prev, props);
    this._updateDefaultShape(prev, props);
    this._updateDefaultStyles(prev, props, state);
    this._updateEdgeLabels(prev, props);
    this._updateEdgePaths(prev, props);
    this._updateEdgeStyles(prev, props, state);
    this._updateInteractionDisabled(prev, props);
    this._updateNodeLabels(prev, props);
    this._updateNodeShapes(prev, props);
    this._updateNodeStyles(prev, props, state);
    this._updateSVG(prev, props);
    this._updateWaypointStyle(prev, props);
    this._updateZoom(prev, props);
  }

  componentWillUnmount() {
    this.props.svg.removeEventListener('mousedown', this._onMouseDown);
    this.props.svg.removeEventListener('mousemove', this._onMouseMove);
    this.props.svg.removeEventListener('mouseup', this._onMouseUp);
    this.props.svg.removeEventListener('wheel', this._onMouseWheel);
  }

  render() {
    return (
      <Provider store={this.store}>
        <g ref={this._setRef}>
          <Defs />
          <EdgesGroup />
          <NodesGroup />
        </g>
      </Provider>
    );
  }

  private _initializePreloadedState = (props: GraphGroupProps<N, E>) => {
    const graph = createGraphState(props.graph);
    const labels = createLabelsState(props.nodeLabels, props.edgeLabels);
    const paths = createPathsState(props.edgePaths, props.defaultPath);
    const selection = createSelectionState();
    const shapes = createShapesState(props.nodeShapes, props.defaultShape);
    const styles = createStylesState(
      props.graph,
      props.nodeStyles,
      props.nodeStylesHovered,
      props.nodeStylesSelected,
      props.edgeStyles,
      props.edgeStylesHovered,
      props.edgeStylesSelected,
      {
        style: props.defaultNodeStyle,
        hovered: props.defaultNodeStyleHovered,
        selected: props.defaultNodeStyleSelected
      },
      {
        style: props.defaultEdgeStyle,
        hovered: props.defaultEdgeStyleHovered,
        selected: props.defaultEdgeStyleSelected
      }
    );
    return { graph, labels, paths, selection, shapes, styles };
  };

  private _onMouseDown = (event: MouseEvent) => {
    if (event.target === this.props.svg)
      this.store.dispatch(mouseDowned(event));
  };

  private _onMouseMove = (event: MouseEvent) => {
    this.store.dispatch(mouseMoved(event));
  };

  private _onMouseUp = (event: MouseEvent) => {
    this.store.dispatch(mouseUpped(event));
  };

  private _onMouseWheel = (event: WheelEvent) => {
    this.store.dispatch(mouseWheeled(event));
  };

  private _setRef = (element: SVGGElement) => {
    this.mouse.setZoomElement(element);
  };

  private _updateCallbacks = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    // Determine which callbacks have changed
    const nodeHovered = prev.onNodeHovered !== props.onNodeHovered;
    const edgeHovered = prev.onEdgeHovered !== props.onEdgeHovered;
    const selectionUpdate =
      prev.onSelectionDidUpdate !== props.onSelectionDidUpdate;
    const graphUpdate = prev.onGraphDidUpdate !== props.onGraphDidUpdate;

    // If they have, create new subscriptions
    if (nodeHovered || edgeHovered || selectionUpdate)
      this.unsubscribeSelectionUpdate = selectionSubscription(
        this.store,
        props,
        this.unsubscribeSelectionUpdate
      );
    if (graphUpdate)
      this.unsubscribeGraphUpdate = graphSubscription(
        this.store,
        props,
        this.unsubscribeGraphUpdate
      );
  };

  private _updateDefaultPath = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.defaultPath !== props.defaultPath)
      this.store.dispatch(defaultPathChanged(props.defaultPath));
  };

  private _updateDefaultShape = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.defaultShape !== props.defaultShape)
      this.store.dispatch(defaultShapeChanged(props.defaultShape));
  };

  private _updateDefaultStyles = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>,
    state: RootState
  ) => {
    const node = prev.defaultNodeStyle !== props.defaultNodeStyle;
    const nodeHovered =
      prev.defaultNodeStyleHovered !== props.defaultNodeStyleHovered;
    const nodeSelected =
      prev.defaultNodeStyleSelected !== props.defaultNodeStyleSelected;
    const edge = prev.defaultEdgeStyle !== props.defaultEdgeStyle;
    const edgeHovered =
      prev.defaultEdgeStyleHovered !== props.defaultEdgeStyleHovered;
    const edgeSelected =
      prev.defaultEdgeStyleSelected !== props.defaultEdgeStyleSelected;
    if (node || nodeHovered || nodeSelected)
      this.store.dispatch(
        nodeStyleDefaultsChanged({
          style: props.defaultNodeStyle,
          hovered: props.defaultNodeStyleHovered,
          selected: props.defaultNodeStyleSelected,
          selectionState: state.selection
        })
      );
    if (edge || edgeHovered || edgeSelected)
      this.store.dispatch(
        edgeStyleDefaultsChanged({
          style: props.defaultEdgeStyle,
          hovered: props.defaultEdgeStyleHovered,
          selected: props.defaultEdgeStyleSelected,
          selectionState: state.selection
        })
      );
  };

  private _updateEdgeLabels = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.edgeLabels !== props.edgeLabels)
      this.store.dispatch(edgeLabelsChanged(props.edgeLabels || {}));
  };

  private _updateEdgePaths = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.edgePaths !== props.edgePaths)
      this.store.dispatch(pathsChanged(props.edgePaths || {}));
  };

  private _updateEdgeStyles = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>,
    state: RootState
  ) => {
    // Determine if any of the three styling defs have changed
    const styles = prev.edgeStyles !== props.edgeStyles;
    const hovered = prev.edgeStylesHovered !== props.edgeStylesHovered;
    const selected = prev.edgeStylesSelected !== props.edgeStylesSelected;

    // If so, dispatch an event that will update edge styles
    if (styles || hovered || selected) {
      this.store.dispatch(
        edgeStyleDefsChanged({
          style: props.edgeStyles || {},
          hovered: props.edgeStylesHovered || {},
          selected: props.edgeStylesSelected || {},
          selectionState: state.selection
        })
      );
    }
  };

  private _updateGraph = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.graph !== props.graph)
      this.store.dispatch(graphChanged(props.graph));
  };

  private _updateInteractionDisabled = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.interactions !== props.interactions)
      this.mouse.setInteractions(!!props.interactions);
  };

  private _updateNodeLabels = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.nodeLabels !== props.nodeLabels)
      this.store.dispatch(nodeLabelsChanged(props.nodeLabels || {}));
  };

  private _updateNodeShapes = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.nodeShapes !== props.nodeShapes)
      this.store.dispatch(shapesChanged(props.nodeShapes || {}));
  };

  private _updateNodeStyles = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>,
    state: RootState
  ) => {
    // Determine if any of the three styling defs have changed
    const styles = prev.nodeStyles !== props.nodeStyles;
    const hovered = prev.nodeStylesHovered !== props.nodeStylesHovered;
    const selected = prev.nodeStylesSelected !== props.nodeStylesSelected;

    // If so, dispatch an event that will update node styles
    if (styles || hovered || selected) {
      this.store.dispatch(
        nodeStyleDefsChanged({
          style: props.nodeStyles || {},
          hovered: props.nodeStylesHovered || {},
          selected: props.nodeStylesSelected || {},
          selectionState: state.selection
        })
      );
    }
  };

  private _updateSVG = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.svg !== props.svg) {
      prev.svg.removeEventListener('mousedown', this._onMouseDown);
      prev.svg.removeEventListener('mousemove', this._onMouseMove);
      prev.svg.removeEventListener('mouseup', this._onMouseUp);
      prev.svg.removeEventListener('wheel', this._onMouseWheel);
      props.svg.addEventListener('mousedown', this._onMouseDown);
      props.svg.addEventListener('mousemove', this._onMouseMove);
      props.svg.addEventListener('mouseup', this._onMouseUp);
      props.svg.addEventListener('wheel', this._onMouseWheel);
    }
  };

  private _updateWaypointStyle = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    // Determine if any of the three styling defs have changed
    const styles = prev.waypointStyle !== props.waypointStyle;
    const hovered = prev.waypointStyleHovered !== props.waypointStyleHovered;
    const selected = prev.waypointStyleSelected !== props.waypointStyleSelected;

    // If so, dispatch an event that will update the waypoint styles
    if (styles || hovered || selected)
      this.store.dispatch(
        waypointStyleChanged({
          style: props.waypointStyle || {},
          hovered: props.waypointStyleHovered || {},
          selected: props.waypointStyleSelected || {}
        })
      );
  };

  private _updateZoom = (
    prev: Readonly<GraphGroupProps<N, E>>,
    props: GraphGroupProps<N, E>
  ) => {
    if (prev.targetZoom !== props.targetZoom)
      if (props.targetZoom) this.mouse.setZoom(props.targetZoom);
    if (prev.targetSpread !== props.targetSpread)
      if (props.targetSpread)
        this.store.dispatch(spreadTargetSet(props.targetSpread));
    if (prev.zoomScaleFactor !== props.zoomScaleFactor)
      this.gesture.setZoomFactor(props.zoomScaleFactor || ZOOM_FACTOR);
  };
}

export default typedMemo(GraphGroup);
