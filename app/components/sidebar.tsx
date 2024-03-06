import React, {useEffect, useRef, useMemo, useState} from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/chatgpt.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";
import Locale from "../locales";

import {useAccessStore, useAppConfig, useChatStore} from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from "../constant";

import { Link, useNavigate } from "react-router-dom";
import { isIOS, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { showConfirm, showToast } from "./ui-lib";
import BrainIcon from "../icons/brain.svg";
import ResetIcon from "../icons/reload.svg";
import API_BASE_URL from "../../config";
import NoticeIcon from "../icons/notice.svg";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

export function SideBar(props: { className?: string ,handleShowDismiss?:() => void}) {

  const chatStore = useChatStore();
  const accessStore = useAccessStore.getState();
  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );
  // 已使用积分-gpt
  const [pointsBalance, setPointsBalance] = useState(0);
  // const [pointsFuturaBalance, setPointsFuturaBalance] = useState(0);
  // 使用的限时免费的额度
  const [pointsBalanceUseFreeTotal, setPointsBalanceUseFreeTotal] = useState(0);

  const [pointsBalanceTotal, setPointsBalanceTotal] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const handleWidthChange = () => {
    const myPointElement = document.getElementById('myPoint');

    if (myPointElement) {
      const divWidth = myPointElement.offsetWidth;
      setIsHidden(divWidth < 90);
    } else {
      // 处理找不到元素的情况，可以输出日志或采取其他适当的措施
      console.error("找不到id为'myPoint'的元素");
    }

  };
  // 已使用积分
  // const [pointsBalance, setPointsBalance] = useState(0);
  // const [pointsBalanceTotal, setPointsBalanceTotal] = useState(0);
  //
  const getPoint = (first : boolean) =>{
    if(accessStore.accessCode){
      fetch(`${API_BASE_URL}/v1/api/getUserPointsBalance`, {
        method: 'GET',
        headers: {
          Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
        },
      })
          .then(response => response.json())
          .then(data => {
            // 处理返回的用户信息数据
            if(data.success){
              setPointsBalanceTotal(data.data.pointsBalanceTotal);
              setPointsBalanceUseFreeTotal(data.data.pointsBalanceUseFreeTotal);
              setPointsBalance(data.data.pointsBalanceUseTotal);
              // let timeoutId;
              // for(let i=0; i<data.data.pointsBalanceUseTotal; i++){
              //   timeoutId = setTimeout(() => {
              //     // 这里放置要执行的代码
              //     setPointsBalance(i)
              //   }, 100);
              // }
              // clearTimeout(timeoutId);
              // if(!first){
              //   showToast('刷新成功！')
              // }
            }else{
              showToast('请求频繁,请稍后再试！')
            }
          })
          .catch(error => {
            console.error('Error:', error);
            // 处理错误情况
          });
    }
  }

  useEffect(() => {
    handleWidthChange(); // 初始加载时调用一次

    // 添加窗口大小变化的事件监听器
    window.addEventListener('resize', handleWidthChange);
    console.log('触发初始化')
    // if(pointsBalanceTotal == 0){
    //   setPointsBalanceTotal(props.pointsBalanceTotal);
    // }
    // if(pointsBalanceUseFreeTotal == 0){
    //   setPointsBalanceUseFreeTotal(props.pointsBalanceUseFreeTotal)
    // }
    // if(pointsBalance == 0){
    //   setPointsBalance(props.pointsBalance)
    // }
    getPoint(false)

  },[]);
  useHotKey();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      {/*<div className={styles["sidebar-header"]} data-tauri-drag-region>*/}
      {/*  <div className={styles["sidebar-title"]} data-tauri-drag-region >*/}
      {/*    Futura GPT*/}
      {/*  </div>*/}

      {/*  <div className={styles["sidebar-sub-title"]}>*/}
      {/*    Futura GPT 结合了先进的Chat-GPT机器学习算法和自然语言处理技术，能够理解和生成自然语言，并具备强大的推理和决策能力.*/}
      {/*  </div>*/}
      {/*  <p/>*/}
      {/*  <div className={styles["sidebar-sub-title"]}>本站已支持 gpt-4-1106-preview*/}
      {/*    、 gpt-3.5-turbo-1106 gpt-3.5-turbo 模型已自动映射为 gpt-3.5-turbo-1106*/}
      {/*  </div>*/}
      {/*  <br/>*/}
      {/*  <div className={styles["sidebar-sub-title"]}>客服联系：<Link onClick={handleQQClick} to=''>客服小F</Link></div>*/}
      {/*</div>*/}

      {/*<div className={styles["sidebar-header-bar"]}>*/}
      {/*  <IconButton*/}
      {/*    icon={<MaskIcon />}*/}
      {/*    text={shouldNarrow ? undefined : Locale.Mask.Name}*/}
      {/*    className={styles["sidebar-bar-button"]}*/}
      {/*    onClick={() => {*/}
      {/*      if (config.dontShowMaskSplashScreen !== true) {*/}
      {/*        navigate(Path.NewChat, { state: { fromHome: true } });*/}
      {/*      } else {*/}
      {/*        navigate(Path.Masks, { state: { fromHome: true } });*/}
      {/*      }*/}
      {/*    }}*/}
      {/*    shadow*/}
      {/*  />*/}
        {/*<IconButton*/}
        {/*  icon={<PluginIcon />}*/}
        {/*  text={shouldNarrow ? undefined : Locale.Plugin.Name}*/}
        {/*  className={styles["sidebar-bar-button"]}*/}
        {/*  onClick={() => showToast(Locale.WIP)}*/}
        {/*  shadow*/}
        {/*/>*/}
      {/*</div>*/}
      <div className={styles["sidebar-tail"]} style={{height:'50px'}}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"] + " " + styles.mobile}>
            <IconButton
                icon={<DeleteIcon />}
                onClick={async () => {
                  if (await showConfirm(Locale.Home.DeleteChat)) {
                    chatStore.deleteSession(chatStore.currentSessionIndex);
                  }
                }}
            />
          </div>
          <div className={styles["sidebar-action"]}>
            <Link to={Path.Settings}>
              <IconButton icon={<SettingsIcon />} shadow />
            </Link>
          </div>

        </div>

        <div>
          <IconButton
              icon={<AddIcon />}
              text={shouldNarrow ? undefined : Locale.Home.NewChat}
              onClick={() => {
                if (config.dontShowMaskSplashScreen) {
                  chatStore.newSession();
                  navigate(Path.Chat);
                } else {
                  navigate(Path.NewChat);
                }
              }}
              shadow
          />

        </div>
      </div>

      <div
          className={styles["sidebar-drag"]}
          onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div>
      <div
        className={styles["sidebar-body"]} style={{height:'900px'}}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            navigate(Path.Home);
          }
        }}
      >
        <ChatList narrow={shouldNarrow} />
      </div>
      <div style={{'gridRow': '1 / -1'}} className={styles[`${isHidden ? 'pointBalanceDiv' : ''}`]} id={'myPoint'}>
        {/* 展示积分信息 */}
        <div style={{'textAlign': 'left'}}>

          <div>
            <h3 style={{'marginBottom': '10px'}}>积分信息</h3>
            {/*消息的logo*/}
            <NoticeIcon
                onClick={props.handleShowDismiss}
                style={{height: '30px',
              width: '25px',
              position: 'absolute',
              right: '25px',
              top: '36px',
              cursor: 'pointer'}}/>
          </div>
          <div style={{'marginBottom': '5px',color:'#666464'}}>
            <BrainIcon width={20} />
            <span>积分：{pointsBalance} / {pointsBalanceTotal}</span>
            <ResetIcon style={{'marginLeft':'10px','cursor':'pointer'}} onClick={() => getPoint(false)}/>
            <br/>
            {/*<BrainIcon width={20} />*/}
            {/*<span>限免消耗💰：{pointsBalanceUseFreeTotal}</span>*/}

          </div>
          <MaskIcon width={20} /><a href={'https://www.mmingsheng.com/links/1524B794'} target={"_blank"}> 订阅积分</a>
        </div>
      </div>
    </div>
  );
}
