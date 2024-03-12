"use client";

import {BuyPage} from "./buy";

require("../polyfill");

import React, { useState, useEffect } from "react";
import styles from "./home.module.scss";
import HomeIcon from "../icons/home.svg";
import CloseIcon from "../icons/close.svg";
import LiaotianIcon from "../icons/liaotian.svg";
import AppIcon from "../icons/app.svg";
import DrawIcon from "../icons/draw.svg";
import BotIcon from "../icons/bot.svg";
import NoticeIcon from "../icons/notice.svg";
import BotIconPng from "../icons/bot.png";
import FGptPng from "../icons/fgpt.png";
import xhPng from "../icons/小红书写手.png";
import xlPng from "../icons/新的聊天.png";
import zyPng from "../icons/职业顾问.png";
import Case1Png from "../icons/case1.png";
import PromptIcon from "../icons/prompt.svg";
import LoadingIcon from "../icons/three-dots.svg";
import BrainIcon from "../icons/brain.svg";
import {copyToClipboard, getCSSVar, useMobileScreen} from "../utils";
import DragIcon from "../icons/drag.svg";
import dynamic from "next/dynamic";
import { Path, SlotID } from "../constant";
import { ErrorBoundary } from "./error";
import Locale, { getISOLang, getLang } from "../locales";
import MaskIcon from "../icons/mask.svg";
import data from './../data/prompt_zh.json';

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { api } from "../client/api";
import { useAccessStore } from "../store";
import {Input, ListItem, Modal, showConfirm, showModal, showPrompt, showToast} from "./ui-lib";
import {IconButton} from "./button";
import {Prompt, SearchService, usePromptStore} from "../store/prompt";
import {nanoid} from "nanoid";
import AddIcon from "../icons/add.svg";
import ClearIcon from "../icons/clear.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import CopyIcon from "../icons/copy.svg";
import {Button} from "emoji-picker-react/src/components/atoms/Button";
import ResetIcon from "../icons/reload.svg";
import Image from "next/image";
import API_BASE_URL from "../../config";
import {Drawing} from "./drawing";
import {show} from "cli-cursor";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <BotIcon />}
      <LoadingIcon />
    </div>
  );
}



const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const Active = dynamic(async () => (await import("./active")).Active, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const PaginationTable = dynamic(async () => (await import("./paginationTable")).PaginationTable, {
  loading: () => <Loading noLogo />,
});


export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    // document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};



function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isHome = location.pathname === Path.Home;
  const isAuth = location.pathname === Path.Auth;
  const isMobileScreen = useMobileScreen();
  const shouldTightBorder = getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);
  const [currentPage, setCurrentPage] = useState("chat");
  const [userInfo, setUserInfo] = useState<{ userName: string, avatarUrl: string } | null>(null);
  const accessStore = useAccessStore.getState();
  const [showLogoutButton, setShowLogoutButton] = useState(false);
  const [showModal, setShowModal] = useState(false); // 控制模态窗口的显示与隐藏
  const [inputValue, setInputValue] = useState(""); // 兑换码的输入值
  // 使用的限时免费的额度
  const [pointsBalanceTotal, setPointsBalanceTotal] = useState(0);

  const [isActiveStatuView, setIsActiveStatuView] = useState(false);
  // 公告
  const [showPrompt, setShowPrompt] = useState(true);

  const setModelhidden = () =>{
    setShowModal(false)
    setCurrentPage('chat')
  }



  const confirmExchange = () => {
    setIsExhangeCodeLoading(true)
    // 发起兑换
    fetch(`${API_BASE_URL}/v1/api/exchangeCode?code=`+inputValue, {
      method: 'GET',
      headers: {
        'Token': accessStore.accessCode,
      }
    })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            showToast(data.data,undefined,5000)
            getPoint(true);
            setInputValue('')
          } else {
            showToast(data.data);
          }
          setIsExhangeCodeLoading(false)
        })
        .catch((error) => {
          // 请求失败，提示用户
          showToast('请求失败，请稍后再试', error);
        });
  }

  const handleMenuClick = (page: any) => {
    setCurrentPage(page);
  };

  const handleShowDismiss = () => {
    console.log('被点击了')
    setShowModal(true);
    setShowPrompt(true);
  };

  const handleDismiss = () => {
    setTimeout(() => {
      setShowPrompt(false);
      const currentDate = new Date().toLocaleDateString();
      localStorage.setItem('dismissedDate', currentDate);
    }, 500); // 延迟1秒执行
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('code');
    if(token){
      setIsActiveStatuView(true);
    }
    setShowModal(true);
    loadAsyncGoogleFont();
    const lastDismissedDate = localStorage.getItem('dismissedDate');
    const currentDate = new Date().toLocaleDateString();

    if (lastDismissedDate === currentDate) {
      setShowPrompt(false);
    }
  }, []);

  const handleMouseEnter = () => {
    setShowLogoutButton(true);
  };

  const handleMouseLeave = () => {
    setShowLogoutButton(false);
  };

  const [userName, setUserName] = useState('');
  const [isUserInfoLoading, setIsUserInfoLoading] = useState(false);
  const [isExhangeCodeLoading, setIsExhangeCodeLoading] = useState(false);

  const [shuomingMarkdownContent, setShuomingMarkdownContent] = useState('');
  const [modelMarkdownContent, setModelMarkdownContent] = useState('');

  const [isEdituserInfo, setIsEdituserInfo] = useState(false);
  const updateConfig = config.update;
  const qqNumber = '854554762';
  const handleQQClick = () => {
    window.location.href = `https://wpa.qq.com/msgrd?v=3&uin=${qqNumber}&site=qq&menu=yes&jumpflag=1`;
  };

  const handleUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserName(event.currentTarget.value);
    setIsEdituserInfo(true);
  };

  const getRandomColor = () =>{
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }


  const handleSubmit = () => {
    if(!isEdituserInfo){
      return;
    }
    if (!userInfo) {
      showToast('数据异常，请刷新！')
      return;
    }
    setIsUserInfoLoading(true);
    // 发起向后台的请求
    fetch(`${API_BASE_URL}/v1/api/updateUserInfo`, {
      method: 'POST',
      headers: {
        Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 'userName':userName,'avatarUrl':userInfo.avatarUrl }),
    })
        .then(response => response.json())
        .then(data => {
          // 处理响应数据
          console.log(data)
          if(!data.success){
            showToast(data.data)
            return;
          }
          showToast(data.data);
          getUserInfo()
          setIsUserInfoLoading(false);
          setIsEdituserInfo(false);
        })
        .catch((error) => {
          // 处理错误
          console.error(error);
          setIsUserInfoLoading(false);
        });
  };

  const getPoint = (first:boolean) =>{
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
              setPointsBalanceTotal(data.data);
              // let timeoutId;
              // for(let i=0; i<data.data.pointsBalanceUseTotal; i++){
              //   timeoutId = setTimeout(() => {
              //
              //   }, 100);
              // }
              // clearTimeout(timeoutId);
              if(!first){
                showToast('刷新成功！')
              }
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

  const formatNumber = (number:number) =>{
    if (number < 1000) {
      return number.toString();
    } else if (number < 10000) {
      return (number / 1000).toFixed(1) + "k";
    } else {
      return (number / 1000).toFixed(1) + "k";
    }
  }

  const getUserInfo = () =>{
    // 发送 GET 请求获取用户信息
    if(accessStore.accessCode){
      fetch(`${API_BASE_URL}/v1/api/getUserInfo`, {
        method: 'GET',
        headers: {
          Token: `${accessStore.accessCode}`, // 使用访问令牌进行身份验证
        },
      })
          .then(response => response.json())
          .then(data => {
            // 处理返回的用户信息数据
            if(data.success){
              setUserInfo(data.data);
              // updateConfig((config) => (config.avatar = userInfo?.avatarUrl));
              setUserName(data.data.userName)
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
    getUserInfo()
    getPoint(true);

    const readMarkdownFile = () => {
      try {
        fetch('https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E.md')
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.text();
            })
            .then(data => {
              setShuomingMarkdownContent(data);
            })
            .catch(error => {
              console.error('Error fetching file:', error);
            });
        fetch('https://doraemon-website.oss-cn-shanghai.aliyuncs.com/futura_doc/%E6%A8%A1%E5%9E%8B%E4%BB%B7%E6%A0%BC.md')
            .then(response => {
              if (!response.ok) {
                throw new Error('Network response was not ok');
              }
              return response.text();
            })
            .then(data => {
              setModelMarkdownContent(data);
            })
            .catch(error => {
              console.error('Error fetching file:', error);
            });
      } catch (error) {
        console.error('Error reading Markdown file:', error);
      }
    };

    readMarkdownFile();

    // const intervalId = setInterval(() => {
    //   const startTime = performance.now();
    //   // 设置断点
    //   debugger;
    //   const currentTime = performance.now();
    //   // 设置一个阈值，例如100毫秒
    //   if (currentTime - startTime > 100) {
    //     window.location.href = 'about:blank';
    //   }
    // }, 100);
    //
    // return () => {
    //   clearInterval(intervalId);
    // };
  }, []);



  return (
    <div className={styles.mainContainer}>
      <div
          className={
            styles.container +
            ` ${shouldTightBorder ? styles["tight-container"] : styles.container} ""
              }`
          }
      >
        <div className={styles.menuContainer}>
          <div className={`${styles.menuLogo}`}>
            <img src={FGptPng.src}
                 style={{borderRadius: '20px',marginBottom: '20px'}}
                 width={50}
                 height={50}
                 alt="bot"
            />
          </div>
          <div className={`${styles.menuA} ${currentPage === "home" ? styles.active : ""}`}>

            <a
                href="#"
                className={`${styles.menu_a}`}
                onClick={() => handleMenuClick("home")}
            >
              <AppIcon className={styles.menuLogoIcon}/>
              <div>首页</div>
            </a>
          </div>

          <a
              href="#"
              className={`${styles.menuA} ${currentPage === "chat" ? styles.active : ""}`}
              onClick={() => handleMenuClick("chat")}
          >
            <LiaotianIcon className={styles.menuLogoIcon}/>
            <div>聊天</div>
          </a>
          {userInfo && (
              <a
                  href="#"
                  className={`${styles.menuA} ${currentPage === "draw" ? styles.active : ""}`}
                  onClick={() => handleMenuClick("draw")}
              >
                <DrawIcon className={styles.menuLogoIcon}/>
                <div>绘画</div>
              </a>
          )}

          <a
              href="https://www.mmingsheng.com//links/1524B794" target={"_blank"}
              className={`${styles.menuA} ${currentPage === "buy" ? styles.active : ""}`}
          >
            订阅
          </a>
          <a
              onClick={() => handleMenuClick("model")}
              className={`${styles.menuA} ${currentPage === "model" ? styles.active : ""}`}
          >
            模型价格
          </a>
          <a
              onClick={() => handleMenuClick("shuoming")}
              className={`${styles.menuA} ${currentPage === "shuoming" ? styles.active : ""}`}
          >
            使用说明
          </a>



          {userInfo && !isActiveStatuView && (
              <div>
                <div
                    onClick={() => handleMenuClick("userInfo")}
                    className={styles.userLogo}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >

                  <img className={styles.userAvatar} src={userInfo?.avatarUrl || ''} alt={"个人中心"}/>
                  {showLogoutButton && (
                      <div className={styles.logOutDiv}>
                        个人中心
                        {/*<a href="#" className={styles.logOut} onClick={async () => {*/}
                        {/*  if (await showConfirm("确认退出吗？")) {*/}
                        {/*    accessStore.update(*/}
                        {/*        (access) => (access.accessCode = ''),*/}
                        {/*    );*/}
                        {/*    // 跳转到首页*/}
                        {/*    window.location.href = '/';*/}
                        {/*  }*/}
                        {/*}}>退出</a>*/}
                      </div>
                  )}

                </div>
              </div>

          )}
          {showModal && showPrompt && (
              <div className={styles.modal}>
                <Modal
                    title="系统公告"
                    onClose={() => {
                      setModelhidden(); // 关闭模态窗口
                    }}
                    actions={[
                      <ListItem title={'今日不再提示🔔'}>
                        <input
                            type="checkbox"
                            checked={!showPrompt}
                            onChange={handleDismiss}
                        ></input>
                      </ListItem>,
                      <IconButton
                          key="reset"
                          icon={<CloseIcon />}
                          bordered
                          text={'关闭'}
                          onClick={async () => {
                            setModelhidden();
                          }}
                      />,
                    ]}
                >
                 <div>
                    <h1>欢迎使用 Futura AI</h1>
                    <span>进群👗联系：zpr110010010；提供bug或是有效建议将会获得积分大礼包奖励🥇</span>
                   <p>
                     📌1.重磅来袭 Claude 3.0 亮相，全新的模型，全新的体验，全新的未来！
                     Claude 3 拥有人类般的理解能力，能学习冷门语言、领悟量子物理理论，还意识到人类在测试它。
                     你可以在这里体验到最新的模型，最新的技术，最新的体验，最新的未来！
                   </p>
                   <p>
                     📌2.gemini-pro-vision 和 gpt-4-vision-preview 两款视觉模型上线，支持图片识别、基于图片内容进行提问等功能。
                   </p>
                    <p>
                      系统内置阶段提供 💰免费的内置高速模型-赶快来免费使用吧！！！
                    </p>
                   <p>
                     文字模型支持： Open AI全部模型、文言一心、讯飞星火大模型、清华智谱模型、阿里通义千问、谷歌大模型等...
                   </p>
                   <p>
                     绘图模型支持：Futura AI绘图🎨等，其它模型持续更新中...
                   </p>
                   <p>
                     支持联网搜索，建议先查看模型价格及常见问题文档
                   </p>
                   {/*<img src={xlPng.src} width={'100%'}/>*/}
                   {/*<img src={xhPng.src} width={'100%'}/>*/}
                   {/*<img src={zyPng.src} width={'100%'}/>*/}
                   {/*<img src={Case1Png.src} width={'100%'}/>*/}
                 </div>
                </Modal>
              </div>
          )}

        </div>
        {currentPage === "shuoming" && (
            <div style={{width:'80%',height:'90%',padding:'20px',margin:'auto',overflow: 'auto' }}>
              <Markdown
                  content={shuomingMarkdownContent}
              />
            </div>

        )}
        {currentPage === "model" && (
            <div style={{width:'80%',height:'90%',padding:'20px',margin:'auto',overflow: 'auto' }}>
              <Markdown
                  content={modelMarkdownContent}
              />
            </div>
        )}
      {currentPage === "home" && !isActiveStatuView && (
          <div className={styles.homeContainer} style={{ textAlign: "center" }}>
            <h1>Futura AI</h1>
            <h2>智能未来的世界欢迎您！</h2>
            <p>在这里，与人工智能一同探索无尽的可能性！</p>
            {/*<p>*/}
            {/*  近期上线计划：<br/><br/>*/}
            {/*    1.提示语-绘图功能*/}
            {/*    2.绘图广场*/}
            {/*    3.轻应用商店*/}
            {/*</p>*/}
            {/*<p>*/}
            {/*  长期上线计划：<br/><br/>*/}
            {/*    1.支持联网*/}
            {/*    2.支持插件功能*/}
            {/*    3.支持知识库系统*/}
            {/*</p>*/}
            {/*<p style={{width:'50%',margin:'auto',marginTop:'50px'}}>*/}
            {/*  接口的调用量按照token进行计算，和openai的token计算标准一致，一般来说每 1000token 约等于 500 个汉字 或 750个英文单词，*/}
            {/*  可以在openai提供的 <a href={'https://platform.openai.com/tokenizer'}>token计算器</a> 中进行模拟。*/}
            {/*  一次对话的token计算包含 请求 和 响应 中的总token数,其中发送的消息会附带上文的消息会更多的消耗积分，请注意⚠️*/}
            {/*</p>*/}
            <div style={{overflowY: 'auto',height: '100%'}}>
              <ul className={styles.showcaseList}>
                {data.map((item) => (
                    <li className={styles.card}>
                      <div className={styles.card__body}>
                        <div className={styles.showcaseCardHeader_Wgbd}>
                          <h4 className={styles.showcaseCardTitle}>
                            <a href={'#'}>{item.zh.title}</a>
                            <span className={styles.showcaseCardBody_fqoj}>🔥{formatNumber(item.weight)}</span>
                          </h4>
                          <div className={'ant-btn-group css-1qhpsh8'}>
                            <CopyIcon width={30} onClick={() => copyToClipboard(item.zh.description)} a/>
                          </div>
                        </div>
                        <p className={styles.showcaseCardBody_fqoj}>
                          👉 {item.zh.remark}
                        </p>
                        <p className={styles.showcaseCardBody_fqoj} style={{'cursor':'pointer'}}>
                          {item.zh.description}
                        </p>
                      </div>
                      <ul className={styles.card__footer}>
                        {item.tags.map((tag) => (
                            <li className={styles.tag}>
                              <span className={styles.textLabel}>{tag}</span>
                              <span className={styles.colorLabel} style={{backgroundColor: getRandomColor()}}/>
                            </li>
                        ))}

                      </ul>
                    </li>
                ))}

              </ul>
            </div>
            <p style={{position:'absolute',bottom: '5px',margin:'auto',width:'95%',color:'#898989',padding: '5px 5px',
              backgroundColor: 'aliceblue'}}>
              发送邮件到 futura_gpt@163.com 将获取最新访问地址。建议记录 <a href={'#'} onClick={handleQQClick}>联系客服</a>
            </p>
          </div>
      )}

        {currentPage === "userInfo" && !isActiveStatuView && (
            <div className={styles.userInfoContainer} style={{ textAlign: "center" }}>
              <div className={styles["userBaseInfo"]} >
                <div className={styles.userBaseInfo_view}>
                  <img className={styles.userBaseInfo_userAvatar} src={userInfo?.avatarUrl || 'default-avatar.jpg'}/>
                  <span className={styles.userBaseInfo_userName}>{userInfo?.userName || 'Guest'}</span>
                  <div style={{'marginTop':'20px'}}>
                    <button className={styles.logOut} onClick={async () => {
                        if (await showConfirm("确认退出吗？")){
                          accessStore.update(
                              (access) => (access.accessCode = ''),
                          );
                          // 跳转到首页*/}
                          window.location.href = '/';
                        }
                      }}>退出登录</button>
                  </div>
                </div>

                <div style={{'position': 'absolute', 'bottom': '0%', 'left': '104px', 'width': '100%','color': 'var(--black)'
                ,'backgroundColor': 'var(--white)','zIndex': 1,'height':'200px','paddingLeft':'30px'}}>
                  {/* 展示积分信息 */}
                  <div style={{'textAlign': 'left'}}>
                    <h3 style={{'marginBottom': '10px'}}>积分信息</h3>
                    <div style={{'marginBottom': '5px',color:'#666464'}}>
                      <BrainIcon width={20} />
                      <span>剩余积分：{pointsBalanceTotal}</span>
                      <ResetIcon style={{'marginLeft':'10px','cursor':'pointer'}} onClick={() => getPoint(false)}/>
                      <br/>
                      {/*<BrainIcon width={20} />*/}
                      {/*<span>限免消耗💰：{pointsBalanceUseFreeTotal}</span>*/}

                    </div>
                    <MaskIcon width={20} /><a href={'https://www.mmingsheng.com/links/1524B794'}> 订阅积分</a>
                  </div>
                </div>
              </div>

              <div className={styles.sider_border}></div>

              <div className={styles["userRecord"]} id={SlotID.AppBody}>
                <div className={styles.userBaseInfoEdit}>
                  <div style={{'width':'50%'}}>
                    <h2>用户基本信息</h2>
                    <div style={{
                      'marginLeft': '20px',
                      'display': 'flex',
                      'flexFlow': 'column',
                      'marginTop': '50px',
                      'alignItems': 'center'}}>

                      <Image
                          src={userInfo?.avatarUrl || ''}
                          width={50}
                          height={50}
                          alt={'用户头像'}
                      />

                      <input
                          type="text"
                          value={userName}
                          maxLength={10}
                          minLength={1}
                          onChange={handleUserNameChange}
                          placeholder="请输入用户名"
                          style={{ backgroundColor: '#FFFFFF','marginTop':'10px','width':'50%' }}
                      />
                      <IconButton
                          disabled={isUserInfoLoading}
                          className={styles.userInfoSubButton}
                          text={isUserInfoLoading ? '提交中...' : '提交'}
                          type="primary"
                          onClick={handleSubmit}
                      />
                    </div>

                  </div>
                  <div style={{'width':'50%'}}>
                    <h2>积分兑换</h2>
                    <Input
                        style={{'marginTop':'50px','width':'50%'}}
                        className={styles['modal-input']}
                        value={inputValue}
                        maxLength={40}
                        onChange={(e) => setInputValue(e.currentTarget.value)}
                        placeholder="请输入兑换码"
                    />
                    <IconButton
                        disabled={isExhangeCodeLoading}
                        className={styles.exchangeCodeSubButton}
                        text={isExhangeCodeLoading ? '兑换中...' : '兑换'}
                        type="primary"
                        onClick={confirmExchange}
                    />
                  </div>
                </div>
                <div className={styles.userBaseBr}></div>
                <div className={styles.userRechargeRecord}>
                    <PaginationTable/>
                </div>
              </div>

            </div>
        )}


        {!userInfo && currentPage === "chat" && !isActiveStatuView && (
          <AuthPage />
      )}
        {currentPage === "draw" && (
            <Drawing />
        )}
        <Routes>
          <Route path={Path.Active} element={<Active />} />
        </Routes>
      {currentPage === "chat" && userInfo && (
          <>
            {/*<div style={{    'color': '#938a8a',*/}
            {/*  'paddingTop': '10px',*/}
            {/*  'paddingLeft': '28px',*/}
            {/*  'height': '47px',*/}
            {/*  'backgroundColor': '#fffbfb',*/}
            {/*  'width': '295px',*/}
            {/*  'position': 'absolute',*/}
            {/*  'left': '102px',*/}
            {/*  'zIndex': '20',*/}
            {/*  'bottom': '1px'}}>*/}
            {/*  <BrainIcon width={20} />*/}
            {/*  <span>积分：{pointsBalance} / {pointsBalanceTotal}</span>*/}
            {/*  <ResetIcon style={{'marginLeft':'10px'}} onClick={() => getPoint()}/>*/}
            {/*</div>*/}
            <SideBar className={isHome ? styles["sidebar-show"] : ""} handleShowDismiss={handleShowDismiss}/>

            <div className={styles["window-content"]} id={SlotID.AppBody}>
              <Routes>
                <Route path={Path.Home} element={<Chat/>} />
                <Route path={Path.NewChat} element={<NewChat />} />
                <Route path={Path.Masks} element={<MaskPage />} />
                <Route path={Path.Chat} element={<Chat  />} />
                <Route path={Path.Settings} element={<Settings />} />
                <Route path={Path.Active} element={<Active />} />
              </Routes>
            </div>
          </>

      )}
      </div>
      </div>

  );
}

export function useLoadData() {
  const config = useAppConfig();

  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }
  // if (!useAccessStore.isAuthorized) {
  //   return <AuthPage />;
  // }
  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}


