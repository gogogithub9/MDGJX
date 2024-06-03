import { useState } from 'react';
import { UnstyledButton, Tooltip, Title, rem } from '@mantine/core';
import {
    IconHome2,
    IconUser,
    IconSettings,
    IconNotebook,
    IconMapSearch,
    IconBook,
    IconLanguage,
    IconApiApp,
    IconNetwork,
    IconSuperscript,
    IconBuildingStore,
    IconStar,
    IconBookmark,
    IconBookmarks,

} from '@tabler/icons-react';
import { MantineLogo } from '@mantinex/mantine-logo';
import classes from './DoubleNavbar.module.css';
import _ from 'lodash';
import GetAppInfo from '@/AppInfo';
import { toolsNavInfo } from './toolsNavInfo.tsx';
import AppConstants from './AppConstants.tsx';

export type LoadModuleType = () => any
export type SystemSubModuleItem = {
    id: string,
    href?: string,
    firstRouteId?:string,
    rootMainModuleId?:string,
    name: string,
    disableFooter?: boolean,
    defaultSubToolId?: string,
    children?: SystemSubModuleItem[],
    bodyFn?: LoadModuleType
}
export type SystemModuleItem = {
    id: string,
    icon?: React.FC<any>;
    label: string,
    defaultHref: string
    fixedAtBottom?:boolean;
    children?: SystemSubModuleItem[]
}
export type RedirectLinkItem = {
    path: string
    url: string
}
export const redirectLinks: RedirectLinkItem[] = [

]

export const Fn_MyAccount = () => import('./loadable/MyAccount/index.tsx')

export const ROUTE_CPT_MAPPING: SystemSubModuleItem[]=[]
window['ROUTE_CPT_MAPPING'] = ROUTE_CPT_MAPPING

const formatModuleItem = (obj: SystemModuleItem[]): SystemModuleItem[] =>{
    return _.map(obj,mainModule=>{
        mainModule.children = mainModule.children?.map((subModule_1: SystemSubModuleItem) => {
            const checkEachMainSubModule = (pid:string,sub: SystemSubModuleItem)=>{
                sub.href = `/${pid}/${sub.id}`
                sub.firstRouteId = pid
                sub.rootMainModuleId = mainModule.id
                ROUTE_CPT_MAPPING.push(sub)
            }
            if(subModule_1.bodyFn){
                checkEachMainSubModule(mainModule.id, subModule_1)
            }else{
                _.forEach(subModule_1.children,(subModule_2)=>{
                    checkEachMainSubModule(subModule_1.id, subModule_2)
                })
            }
            return subModule_1
        }) || []
        return mainModule 
    })
}

export const systemModulesList: SystemModuleItem[] = formatModuleItem([
    {
        id: 'main',
        defaultHref: '/tools/index',
        icon: IconHome2, 
        label: '主页', 
        children: [
            {
                id: 'tools',
                name: '便捷工具',
                children:  [
                    {
                        name: "工具总览",
                        id: 'index',
                        bodyFn: () => import('./loadable/XToolsView/index.tsx')
                    },
                    ...toolsNavInfo.map(x => {
                        return {
                            name: x.name,
                            id: x.id,
                            disableFooter: true,
                            defaultSubToolId: x.defaultSubToolId,
                            bodyFn: () => import('./loadable/XToolsDetail/index.tsx')
                        } satisfies SystemSubModuleItem
                    })
                ]
            },
            {
                id: 'i18n',
                // icon: IconLanguage,
                name: '翻译助手',
                children:  [
                    {
                        name: '文本翻译',
                        id: 'text',
                        bodyFn: () => import('./loadable/TLNText/index.tsx')
                    },
                    {
                        name: 'JSON 格式翻译',
                        id: 'json',
                        bodyFn: () => import('./loadable/TLNJSON/index.tsx')
                    },
                    {
                        name: 'JSON 中英文对照',
                        id: 'json-cn-en',
                        bodyFn: () => import('./loadable/TLNJSONComparison/index.tsx')
                    },
                    {
                        name: 'Markdown 文档翻译',
                        id: 'md',
                        bodyFn: () => import('./loadable/TLNMarkdown/index.tsx')
                    },
                    {
                        name: '简繁中文对照翻译',
                        id: 'ftzt',
                        bodyFn: () => import('./loadable/TLNZTFT/index.tsx')
                    },
                ]
            },
            {
                id: 'network',
                // icon: IconNetwork,
                name: '网络运维',
                children: [
                    {
                        name: 'IP/域名质量监测',
                        id: 'ipstats',
                        disableFooter: true,
                        bodyFn: () => import('./loadable/IPDomainQualityStat/index.tsx')
                    },
                ]
            },
        ]
    },
    {
        id: 'collections',
        icon: IconBookmarks,
        defaultHref: '/collections/index',
        label: '收藏夹',
        children: [
            {
                name: '首页',
                id: 'index',
                disableFooter: true,
                bodyFn: () => import('./loadable/NotOK/index.tsx')
            },
        ]
    },
    {
        id: 'marketplace',
        defaultHref: '/marketplace/index',
        icon: IconBuildingStore,
        label: '插件市场',
        children: [
            {
                name: '首页',
                id: 'index',
                disableFooter: true,
                bodyFn: () => import('./loadable/NotOK/index.tsx')
            },
        ]
    },
    {
        id: 'settings',
        defaultHref: '/settings/my-account',
        fixedAtBottom: true,
        icon: IconSettings, label: '系统设置',
        children:[
            {
                name: '我的账号',
                id: 'my-account',
                bodyFn: Fn_MyAccount
            },
            {
                name: '常见问题',
                id: 'faq',
                bodyFn: () => import('./loadable/FAQ/index.tsx')
            },
            {
                name: '使用条款',
                id: 'terms-of-conditions',
                bodyFn: () => import('./loadable/TermsOfConditions/index.tsx')
            },
            {
                name: '隐私保护协议',
                id: 'privacy-agreement',
                bodyFn: () => import('./loadable/PrivacyAgreement/index.tsx')
            },
            {
                name: '建议与反馈',
                bodyFn: () => import('./loadable/Feedback/index.tsx'),
                id: 'feedback'
                // we can put ticket button in this page -> href: GetAppInfo().githubRepo + '/issues/new'
            },
            {
                name: '关于软件',
                id: 'about',
                bodyFn: () => import('./loadable/AboutSoftware/index.tsx'),
            },
        ]
    },
] satisfies SystemModuleItem[]);


