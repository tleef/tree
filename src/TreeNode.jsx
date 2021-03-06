import React from 'react';
import PropTypes from 'prop-types';
import assign from 'object-assign';
import classNames from 'classnames';
import Animate from 'rc-animate';
import toArray from 'rc-util/lib/Children/toArray';

const defaultTitle = '---';

class TreeNode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      dataLoading: false,
      dragNodeHighlight: false,
    };
  }

  componentDidMount() {
    if (!this.props.root._treeNodeInstances) {
      this.props.root._treeNodeInstances = [];
    }
    this.props.root._treeNodeInstances.push(this);
  }

  onCheck = () => {
    this.props.root.onCheck(this);
  };

  onExpand = () => {
    const callbackPromise = this.props.root.onExpand(this);
    if (callbackPromise && typeof callbackPromise === 'object') {
      const setLoading = (dataLoading) => {
        this.setState({ dataLoading });
      };
      setLoading(true);
      callbackPromise.then(() => {
        setLoading(false);
      }, () => {
        setLoading(false);
      });
    }
  };

  onClick = (e) => {
    e.preventDefault();
    const props = this.props;
    props.root.onClick(e, this);
    if (props.selectable) {
      props.root.onSelect(this);
    }
  };

  onContextMenu = (e) => {
    e.preventDefault();
    this.props.root.onContextMenu(e, this);
  };

  onDoubleClick = (e) => {
    e.preventDefault();
    this.props.root.onDoubleClick(e, this);
  };

  onDragEnd = (e) => {
    e.stopPropagation();
    this.setState({
      dragNodeHighlight: false,
    });
    this.props.root.onDragEnd(e, this);
  };

  onDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.props.root.onDragEnter(e, this);
  };

  onDragLeave = (e) => {
    e.stopPropagation();
    this.props.root.onDragLeave(e, this);
  };

  onDragOver = (e) => {
    // todo disabled
    e.preventDefault();
    e.stopPropagation();
    this.props.root.onDragOver(e, this);
    return false;
  };

  onDragStart = (e) => {
    e.stopPropagation();
    this.setState({
      dragNodeHighlight: true,
    });
    this.props.root.onDragStart(e, this);
    try {
      // ie throw error
      // firefox-need-it
      e.dataTransfer.setData('text/plain', '');
    } catch (error) {
      // empty
    }
  };

  onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({
      dragNodeHighlight: false,
    });
    this.props.root.onDrop(e, this);
  };

  onMouseEnter = (e) => {
    e.preventDefault();
    this.props.root.onMouseEnter(e, this);
  };

  onMouseLeave = (e) => {
    e.preventDefault();
    this.props.root.onMouseLeave(e, this);
  };

  // keyboard event support
  onKeyDown = (e) => {
    e.preventDefault();
  };

  renderSwitcher(props, expandedState) {
    const prefixCls = props.prefixCls;
    const switcherCls = {
      [`${prefixCls}-switcher`]: true,
    };
    if (!props.showLine) {
      switcherCls[`${prefixCls}-noline_${expandedState}`] = true;
    } else if (props.pos === '0-0') {
      switcherCls[`${prefixCls}-roots_${expandedState}`] = true;
    } else {
      switcherCls[`${prefixCls}-center_${expandedState}`] = !props.last;
      switcherCls[`${prefixCls}-bottom_${expandedState}`] = props.last;
    }
    if (props.disabled) {
      switcherCls[`${prefixCls}-switcher-disabled`] = true;
      return <span className={classNames(switcherCls)} />;
    }
    return <span className={classNames(switcherCls)} onClick={this.onExpand} />;
  }

  renderCheckbox(props) {
    const prefixCls = props.prefixCls;
    const checkboxCls = {
      [`${prefixCls}-checkbox`]: true,
    };
    if (props.checked) {
      checkboxCls[`${prefixCls}-checkbox-checked`] = true;
    } else if (props.halfChecked) {
      checkboxCls[`${prefixCls}-checkbox-indeterminate`] = true;
    }
    let customEle = null;
    if (typeof props.checkable !== 'boolean') {
      customEle = props.checkable;
    }
    if (props.disabled || props.disableCheckbox) {
      checkboxCls[`${prefixCls}-checkbox-disabled`] = true;
      return <span ref="checkbox" className={classNames(checkboxCls)}>{customEle}</span>;
    }
    return (
      <span ref="checkbox"
        className={classNames(checkboxCls) }
        onClick={this.onCheck}
      >
        {customEle}
      </span>);
  }

  renderChildren(props) {
    const renderFirst = this.renderFirst;
    this.renderFirst = 1;
    let transitionAppear = true;
    if (!renderFirst && props.expanded) {
      transitionAppear = false;
    }
    const children = props.children ? toArray(props.children) : props.children;
    let newChildren = children;
    if (children &&
      (Array.isArray(children) &&
        children.every((item) => item.type && item.type.isTreeNode) ||
        (children.type && children.type.isTreeNode))) {
      const cls = {
        [`${props.prefixCls}-child-tree`]: true,
        [`${props.prefixCls}-child-tree-open`]: props.expanded,
      };
      if (props.showLine) {
        cls[`${props.prefixCls}-line`] = !props.last;
      }
      const animProps = {};
      if (props.openTransitionName) {
        animProps.transitionName = props.openTransitionName;
      } else if (typeof props.openAnimation === 'object') {
        animProps.animation = assign({}, props.openAnimation);
        if (!transitionAppear) {
          delete animProps.animation.appear;
        }
      }
      newChildren = (
        <Animate {...animProps}
          showProp="data-expanded"
          transitionAppear={transitionAppear}
          component=""
        >
          {!props.expanded ? null : <ul className={classNames(cls)} data-expanded={props.expanded}>
            {React.Children.map(children, (item, index) => {
              return props.root.renderTreeNode(item, index, props.pos);
            }, props.root)}
          </ul>}
        </Animate>
      );
    }
    return newChildren;
  }

  render() {
    const props = this.props;
    const prefixCls = props.prefixCls;
    const expandedState = props.expanded ? 'open' : 'close';
    let iconState = expandedState;

    let canRenderSwitcher = true;
    const content = props.title;
    let newChildren = this.renderChildren(props);
    if (!newChildren || newChildren === props.children) {
      newChildren = null;
      if (!props.loadData || props.isLeaf) {
        canRenderSwitcher = false;
        iconState = 'docu';
      }
    }

    const iconEleCls = {
      [`${prefixCls}-iconEle`]: true,
      [`${prefixCls}-icon_loading`]: this.state.dataLoading,
      [`${prefixCls}-icon__${iconState}`]: true,
    };

    const selectHandle = () => {
      const icon = (props.showIcon || props.loadData && this.state.dataLoading) ?
        <span className={classNames(iconEleCls)} /> : null;
      const title = <span className={`${prefixCls}-title`}>{content}</span>;
      const wrap = `${prefixCls}-node-content-wrapper`;
      const domProps = {
        className: `${wrap} ${wrap}-${iconState === expandedState ? iconState : 'normal'}`,
      };
      if (!props.disabled) {
        if (props.selected || !props._dropTrigger && this.state.dragNodeHighlight) {
          domProps.className += ` ${prefixCls}-node-selected`;
        }

        domProps.onClick = this.onClick;

        if (props.onDoubleClick) {
          domProps.onDoubleClick = this.onDoubleClick;
        }
        if (props.onRightClick) {
          domProps.onContextMenu = this.onContextMenu;
        }
        if (props.onMouseEnter) {
          domProps.onMouseEnter = this.onMouseEnter;
        }
        if (props.onMouseLeave) {
          domProps.onMouseLeave = this.onMouseLeave;
        }
        if (props.draggable) {
          domProps.className += ' draggable';
          domProps.draggable = true;
          domProps['aria-grabbed'] = true;
          domProps.onDragStart = this.onDragStart;
        }
      }
      return (
        <span ref="selectHandle" title={typeof content === 'string' ? content : ''} {...domProps}>
          {icon}{title}
        </span>
      );
    };

    const liProps = {};
    if (props.draggable) {
      liProps.onDragEnter = this.onDragEnter;
      liProps.onDragOver = this.onDragOver;
      liProps.onDragLeave = this.onDragLeave;
      liProps.onDrop = this.onDrop;
      liProps.onDragEnd = this.onDragEnd;
    }

    let disabledCls = '';
    let dragOverCls = '';
    if (props.disabled) {
      disabledCls = `${prefixCls}-treenode-disabled`;
    } else if (props.dragOver) {
      dragOverCls = 'drag-over';
    } else if (props.dragOverGapTop) {
      dragOverCls = 'drag-over-gap-top';
    } else if (props.dragOverGapBottom) {
      dragOverCls = 'drag-over-gap-bottom';
    }

    const filterCls = props.filterTreeNode(this) ? 'filter-node' : '';

    const noopSwitcher = () => {
      const cls = {
        [`${prefixCls}-switcher`]: true,
        [`${prefixCls}-switcher-noop`]: true,
      };
      if (props.showLine) {
        cls[`${prefixCls}-center_docu`] = !props.last;
        cls[`${prefixCls}-bottom_docu`] = props.last;
      } else {
        cls[`${prefixCls}-noline_docu`] = true;
      }
      return <span className={classNames(cls)} />;
    };

    return (
      <li {...liProps} ref="li"
        className={classNames(props.className, disabledCls, dragOverCls, filterCls) }
      >
        {canRenderSwitcher ? this.renderSwitcher(props, expandedState) : noopSwitcher()}
        {props.checkable ? this.renderCheckbox(props) : null}
        {selectHandle()}
        {newChildren}
      </li>
    );
  }
}

TreeNode.isTreeNode = 1;

TreeNode.propTypes = {
  prefixCls: PropTypes.string,
  disabled: PropTypes.bool,
  disableCheckbox: PropTypes.bool,
  expanded: PropTypes.bool,
  isLeaf: PropTypes.bool,
  root: PropTypes.object,
  onSelect: PropTypes.func,
};

TreeNode.defaultProps = {
  title: defaultTitle,
};

export default TreeNode;
