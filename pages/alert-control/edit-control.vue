<template>
	<view class="pagehome">
		<view class="tp-box tp-box-sizing tp-flex tp-flex-col">

			<view class="tp-panel tp-flex tp-flex-col tp-mg-l-r-30">
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-l tp-flex-a-c tp-box-sizing tp-pd-t-b-25">
					<view>{{$t('pages.addControl.strategyName')}}</view>
					<input type="text" class="tp-flex-1 tp-mg-l-20" :placeholder="$t('pages.addControl.inputName')" placeholder-class="tp-plc"
						v-model="formData.name" />
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-l tp-flex-a-c tp-box-sizing tp-pd-t-b-25">
					<view>{{$t('pages.addControl.strategyDescription')}}</view>
					<input type="text" class="tp-flex-1 tp-mg-l-20" :placeholder="$t('pages.addControl.inputDescription')" placeholder-class="tp-plc"
						v-model="formData.describe" />
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-l tp-flex-a-c tp-box-sizing tp-pd-t-b-25">
					<view>{{$t('pages.addControl.strategyPriority')}}</view>
					<input type="number" class="tp-flex-1 tp-mg-l-20" :placeholder="$t('pages.addControl.inputPriority')" placeholder-class="tp-plc"
						v-model="formData.sort" />
				</view>
			</view>

			<view class="tp-txt tp-box-sizing tp-mg-30">{{$t('pages.addControl.triggerCondition')}}
				<view class="add_btn" @click="toAddtrig">
					{{$t('pages.addControl.addNewRow')}}
				</view>
			</view>
			<view class="tp-panel tp-flex tp-flex-col tp-mg-l-r-30" v-for="(data,index) in trigList" :key='index'
				:style="{background:index==0?'#fff':'#F6F8FA'}">
				<view class="info_header" v-if="data.relationship">
					<view class="tp-circle tp-mg-l-r-20 tp-active" style="margin-left: 10rpx;">
					</view>
					<view class="info_header_d">
						{{data.relationshipName}}
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="index == 0">
					<view>{{$t('pages.addControl.deviceConditionType')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c"
						@click="toSelectConditionType(data,'trig')">
						<text class="tp-mg-r-10" v-if="data.conditionTypeName">{{data.conditionTypeName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="trigList[0].conditionType == 1">
					<view>{{$t('pages.addControl.selectDeviceGroup')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c"
						@click="toSelectEqpGroup(data,'trig')">
						<text class="tp-mg-r-10" v-if="data.eqpGroupName">{{data.eqpGroupName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="trigList[0].conditionType == 1">
					<view>{{$t('pages.addControl.selectDevice')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c"
						@click="toSelectEqp(data,'trig')">
						<text class="tp-mg-r-10" v-if="data.eqpName">{{data.eqpName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="trigList[0].conditionType == 1">
					<view>{{$t('pages.addControl.condition')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c"
						@click="toSelectCondition(data,'trig')">
						<text class="tp-mg-r-10" v-if="data.conditionName">{{data.conditionName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="trigList[0].conditionType == 1">
					<view>{{$t('pages.addControl.symbol')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c"
						@click="toSelectSymbol(data,'trig')">
						<text class="tp-mg-r-10" v-if="data.symbolName">{{data.symbolName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="trigList[0].conditionType == 1">
					<view>{{$t('pages.addControl.value')}}</view>
					<input type="number" class="tp-flex-1 tp-mg-l-20 add_input" :placeholder="$t('pages.addControl.inputValue')"
						placeholder-class="tp-plc" v-model="data.trigNum" v-if="data.filedType == 3" />
						<input v-else type="text" class="tp-flex-1 tp-mg-l-20 add_input" :placeholder="$t('pages.addControl.inputValue')"
							placeholder-class="tp-plc" v-model="data.trigNum" />
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="trigList[0].conditionType == 2">
					<view>{{$t('pages.addControl.times')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c" @click="toSelectCishu(data)">
						<text class="tp-mg-r-10" v-if="data.cishuName">{{data.cishuName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="trigList[0].conditionType == 2">
					<view v-if="data.cishu == 0">{{$t('pages.addControl.date')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c" v-if="data.cishu == 0">
						<uni-datetime-picker type="datetime" v-model="data.dateTime">
							<view style="font-size: 26rpx;color: #999;text-align: right;">
								{{data.dateTime?data.dateTime:$t('pages.addControl.selectDate')}}
							</view>
						</uni-datetime-picker>
						<view class="iconfont iconjiantou1"></view>
					</view>
					<view v-if="data.cishu == 1">{{$t('pages.addControl.time')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c" v-if="data.cishu == 1">
						<picker mode="time" :value="data.dateTime" start="00:00" end="23:59" @change="bindTimeChange(data,$event)">
							<view class="uni-input">{{data.dateTime?data.dateTime:$t('pages.addControl.selectTime')}}</view>
						</picker>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="index!=0">
						<view class="del_btn" @click="toDeltrig(data,index)">
							<image src="../../static/icon/del.png" alt="" />{{$t('common.delete')}}
						</view>
					</view>
			</view>
			<view class="tp-txt tp-box-sizing tp-mg-30">{{$t('pages.addControl.executeCommand')}}
				<view class="add_btn" @click="toAddCon">
					{{$t('pages.addControl.addNewRow')}}
				</view>
			</view>

			<view class="tp-panel tp-flex tp-flex-col tp-mg-l-r-30" v-for="(data,index) in controlList" :key="index"
				:style="{background:index==0?'#fff':'#F6F8FA',marginBottom: '15rpx'}">
				<view class="info_header" v-if="data.relationship">
					<view class="tp-circle tp-mg-l-r-20 tp-active" style="margin-left: 10rpx;">
					</view>
					<view class="info_header_d">
						{{data.relationshipName}}
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25">
					<view>{{$t('pages.addControl.selectDeviceGroup')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c"
						@click="toSelectEqpGroup(data,'con')">
						<text class="tp-mg-r-10" v-if="data.eqpGroupName">{{data.eqpGroupName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25">
					<view>{{$t('pages.addControl.selectDevice')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c"
						@click="toSelectEqp(data,'con')">
						<text class="tp-mg-r-10" v-if="data.eqpName">{{data.eqpName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25">
					<view>{{$t('pages.addControl.condition')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c"
						@click="toSelectCondition(data,'con')">
						<text class="tp-mg-r-10" v-if="data.conditionName">{{data.conditionName}}</text>
						<view class="iconfont iconjiantou1"></view>
					</view>
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25">
					<view>{{$t('pages.addControl.value')}}</view>
					<input type="number" class="tp-flex-1 tp-mg-l-20 add_input" :placeholder="$t('pages.addControl.inputValue')"
						placeholder-class="tp-plc" v-model="data.conNum" v-if="data.filedType == 3" />
						<input v-else type="text" class="tp-flex-1 tp-mg-l-20 add_input" :placeholder="$t('pages.addControl.inputValue')"
							placeholder-class="tp-plc" v-model="data.conNum" />
				</view>
				<view class="tp-ipt-item tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25"
					v-if="index!=0">
						<view class="del_btn" @click="toDelCon(data,index)">
							<image src="../../static/icon/del.png" alt="" />{{$t('common.delete')}}
						</view>
					</view>
			</view>
			<view class="tp-txt tp-box-sizing tp-mg-30"></view>
			<view class="tp-panel tp-flex tp-flex-col tp-mg-l-r-30">
				<view class="tp-flex tp-flex-row tp-flex-j-s tp-flex-a-c tp-box-sizing tp-pd-t-b-25">
					<view style="font-weight: bold;">{{$t('pages.addControl.strategyStatus')}}</view>
					<view class="tp-flex-1 tp-flex tp-flex-row tp-flex-j-r tp-flex-a-c">
						<view class="switchBtn">
							<view class="on">
								<view class="onIcon" v-if="switchOnTwo == 1" @click="switchOnTwo=0;switchCloseTwo=1">
								</view>
								<view class="closeIcon" v-else @click="switchOnTwo=1;switchCloseTwo=0">
									<view class="closeIconL"></view>
								</view>
								<i style="font-style: normal;">{{$t('pages.addControl.on')}}</i>
							</view>
							<view class="close">
								<view class="closeIcon" v-if="switchCloseTwo == 0"
									@click="switchCloseTwo=1;switchOnTwo=0">
									<view class="closeIconL"></view>
								</view>
								<view class="onIcon" v-else @click="switchCloseTwo=0;switchOnTwo=1"></view>
								{{$t('pages.addControl.off')}}
							</view>
						</view>
					</view>
				</view>
			</view>
			<view class="tp-box-sizing tp-mg-l-r-30" style="padding: 0;">
				<button class="tp-btn" :loading="loading" :class="{'vc-btn-disabled':disabled}" @tap="doUpdateSubmit"
					style="margin-bottom: 118rpx;">{{$t('pages.addControl.save')}}</button>
			</view>
			<!-- 设备条件类型 -->
			<uni-popup ref="conditionType" type="bottom">
				<scroll-view :scroll-y="true" scroll-with-animation="true"
					:style="{ maxHeight: '700rpx',background:'#fff' }">
					<view class="selectlist">
						<view class="select_item" v-for="(item,index) in conditionTypeList" :key="index"
							@click="comfirConditionType(item)">
							{{item.label}}
						</view>
					</view>
				</scroll-view>
			</uni-popup>
			<!-- 设备分组 -->
			<uni-popup ref="eqpGroups" type="bottom">
				<scroll-view :scroll-y="true" scroll-with-animation="true"
					:style="{ maxHeight: '700rpx',background:'#fff' }">
					<view class="selectlist">
						<view class="select_item" v-for="(item,index) in eqpGroupsList" :key="index"
							@click="toConfirmeqpGroup(item)">
							{{item.device_group}}
						</view>
					</view>
				</scroll-view>
			</uni-popup>
			<!-- 设备 -->
			<uni-popup ref="eqpPopup" type="bottom">
				<scroll-view :scroll-y="true" scroll-with-animation="true"
					:style="{ maxHeight: '700rpx',background:'#fff' }">
					<view class="selectlist">
						<view class="select_item" v-for="(item,index) in eqpList" :key="index" @click="comfirEqp(item)">
							{{item.name}}
						</view>
					</view>
				</scroll-view>
			</uni-popup>
			<!-- 选择条件 -->
			<uni-popup ref="conditionPopup" type="bottom">
				<scroll-view :scroll-y="true" scroll-with-animation="true"
					:style="{ maxHeight: '700rpx',background:'#fff' }">
					<view class="selectlist">
						<view class="select_item" v-for="(item,index) in conditionList" :key="index"
							@click="confirmCondition(item)">
							{{item.name}}
						</view>
					</view>
				</scroll-view>
			</uni-popup>
			<!-- 选择符号 -->
			<uni-popup ref="symbolPopup" type="bottom">
				<scroll-view :scroll-y="true" scroll-with-animation="true"
					:style="{ maxHeight: '700rpx',background:'#fff' }">
					<view class="selectlist">
						<view class="select_item" v-for="(item,index) in symbolList" :key="index"
							@click="confirmSymbol(item)">
							{{item.name}}
						</view>
					</view>
				</scroll-view>
			</uni-popup>
			<!-- 关系 -->
			<uni-popup ref="relationshipPopup" type="bottom">
				<scroll-view :scroll-y="true" scroll-with-animation="true"
					:style="{ maxHeight: '700rpx',background:'#fff' }">
					<view class="selectlist">
						<view class="select_item" v-for="(item,index) in relationshipList" :key="index"
							@click="confirmrRelationship(item)">
							{{item.name}}
						</view>
					</view>
				</scroll-view>
			</uni-popup>
			<!-- 选择次数 -->
			<uni-popup ref="cishuPopup" type="bottom">
				<scroll-view :scroll-y="true" scroll-with-animation="true"
					:style="{ maxHeight: '700rpx',background:'#fff' }">
					<view class="selectlist">
						<view class="select_item" v-for="(item,index) in cishuList" :key="index"
							@click="confirmrCishu(item)">
							{{item.name}}
						</view>
					</view>
				</scroll-view>
			</uni-popup>

			<!-- 新增触发条件 -->
				<uni-popup ref="addtrigPopup" type="bottom" :mask="true" :maskClick="true">
					<view class="logInfo">
							<view class="info_title">
								{{$t('pages.addControl.addNewTrigger')}}
								<image src="../../static/icon/close.png" alt="" @click="addtrigPopup?.close?.()" />
							</view>
					<view class="info_header">
						<view class="tp-circle tp-mg-l-r-20 tp-active" style="margin-left: 10rpx;">
						</view>
						<view class="info_header_d">
							{{addTrigForm.relationshipName}}
						</view>
						<span class="info_header_t" @click="relationship('trig')">
							<view class="iconfont iconjiantou1"></view>
						</span>
					</view>
					<view class="info_list" v-if="trigList[0].conditionType == 1">
						<view class="item" @click="toSelectEqpGroupAdd('trig')">
							<view class="value">
								{{$t('pages.addControl.pleaseSelectDeviceGroup')}}：
							</view>
							<view class="label">
								{{addTrigForm.eqpGroupName}}
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item" @click="toSelectEqpAdd('trig')">
							<view class="value">
								{{$t('pages.addControl.pleaseSelectDevice')}}：
							</view>
							<view class="label">
								{{addTrigForm.eqpName}}
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item" @click="toSelectConditionAdd('trig')">
							<view class="value">
								{{$t('pages.addControl.condition')}}：
							</view>
							<view class="label">
								{{addTrigForm.conditionName}}
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item" @click="toSelectSymbolAdd('trig')">
							<view class="value">
								{{ $t('pages.addControl.symbol') }}：
							</view>
							<view class="label">
								{{addTrigForm.symbolName}}
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item">
							<view class="value">
								{{$t('pages.addControl.value')}}：
							</view>
							<input type="number" class="tp-flex-1 tp-mg-l-20" :placeholder="$t('pages.addControl.pleaseEnterValue')"
								placeholder-class="tp-plc" v-model="addTrigForm.trigNum" v-if="addTrigForm.filedType == 3" />
							<input v-else type="text" class="tp-flex-1 tp-mg-l-20" :placeholder="$t('pages.addControl.pleaseEnterValue')"
								placeholder-class="tp-plc" v-model="addTrigForm.trigNum" />
						</view>
					</view>
					<view class="info_list" v-if="trigList[0].conditionType == 2">
						<view class="item" @click="toSelectCishuAdd()">
							<view class="value">
								{{ $t('pages.addControl.times') }} ：
							</view>
							<view class="label">
								{{addTrigForm.cishuName}}
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item" v-if="addTrigForm.cishu == 0">
							<view class="value">
								{{ $t('pages.addControl.times') }}：
							</view>
							<view class="label">
								<uni-datetime-picker type="datetime" v-model="addTrigForm.dateTime"
									@change="changeLog" />
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item" v-if="addTrigForm.cishu == 1">
							<view class="value">
								{{ $t('pages.addControl.time') }}：
							</view>
							<view class="label">
								<picker mode="time" :value="addTrigForm.dateTime" start="00:00" end="23:59"
									@change="bindTimeChangeAdd($event)">
									<view class="uni-input">{{addTrigForm.dateTime ? addTrigForm.dateTime : $t('pages.addControl.selectTime')}}</view>
								</picker>
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
					</view>
						<view class="info_btn">
							<view class="btn_del" @click="addtrigPopup?.close?.()">{{$t('pages.addControl.cancel')}}</view>
							<view class="btn_save" @click="saveTrig()">{{$t('pages.addControl.saveBtn')}}</view>
						</view>
					</view>
				</uni-popup>
			<!-- 新增执行命令 -->
				<uni-popup ref="addConPopup" type="bottom" :mask="true" :maskClick="true">
					<view class="logInfo">
						<view class="info_title">
							{{$t('pages.addControl.addNewCommand')}}
							<image src="../../static/icon/close.png" alt="" @click="addConPopup?.close?.()" />
						</view>
					<view class="info_list">
						<view class="item" @click="toSelectEqpGroupAdd('con')">
							<view class="value">
								{{$t('pages.addControl.pleaseSelectDeviceGroup')}}：
							</view>
							<view class="label">
								{{addConForm.eqpGroupName}}
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item" @click="toSelectEqpAdd('con')">
							<view class="value">
								{{$t('pages.addControl.pleaseSelectDevice')}}：
							</view>
							<view class="label">
								{{addConForm.eqpName}}
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item" @click="toSelectConditionAdd('con')">
							<view class="value">
								{{$t('pages.addControl.condition')}}：
							</view>
							<view class="label">
								{{addConForm.conditionName}}
							</view>
							<view class="iconfont iconjiantou1"></view>
						</view>
						<view class="item">
							<view class="value">
								{{ $t('pages.addControl.value') }}：
							</view>
							<input type="number" class="tp-flex-1 tp-mg-l-20" :placeholder="$t('pages.addControl.inputValue')"
								placeholder-class="tp-plc" v-model="addConForm.conNum"
								v-if="addConForm.filedType == 3" />
							<input v-else type="text" class="tp-flex-1 tp-mg-l-20" :placeholder="$t('pages.addControl.inputValue')"
								placeholder-class="tp-plc" v-model="addConForm.conNum" />
						</view>
						</view>
						<view class="info_btn">
							<view class="btn_del" @click="addConPopup?.close?.()">{{$t('pages.addControl.cancel')}}</view>
							<view class="btn_save" @click="saveCon()">{{$t('pages.addControl.saveBtn')}}</view>
						</view>
					</view>
				</uni-popup>
				<!-- 消息提示框 -->
				<cys-toast ref="toastRef" :msg="toast.msg" location="top"></cys-toast>
			</view>
		</view>
	</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'

import { useInjected, type ApiResponse } from '@/common/composables/useInjected'

type PopupLike = { open?: () => void; close?: () => void }

interface ConditionTypeItem {
	label: string
	value: number
}

interface EqpGroupItem {
	id: string
	device_group: string
}

interface EqpItem {
	device_id: string
	name: string
}

interface ConditionItem {
	key: string
	name: string
	type: string | number
	symbol: string
}

interface SymbolItem {
	name: string
	id: string
	key?: string
}

interface RelationshipItem {
	name: string
	id: string
}

interface TimesItem {
	name: string
	id: number
}

interface TrigForm {
	eqpGroup: string
	eqpGroupName: string
	eqp: string
	eqpName: string
	condition: string
	conditionName: string
	filedType: string | number
	field_symbol?: string
	symbol: string
	symbolName: string
	trigNum: string
	relationship: string
	relationshipName: string
	cishu: number
	cishuName: string
	dateTime: string
}

interface ConForm {
	eqpGroup: string
	eqpGroupName: string
	eqp: string
	eqpName: string
	condition: string
	conditionName: string
	filedType: string | number
	field_symbol?: string
	conNum: string
	relationship: string
	relationshipName: string
}

type TrigItem = Partial<TrigForm> & { conditionType?: number | string; conditionTypeName?: string }
type ConItem = Partial<ConForm> & { symbol?: string; symbolName?: string }

interface AutomationRuleItem {
	asset_id: string
	device_id: string
	field: string
	field_type?: string | number
	duration?: string
	condition?: string
	value?: string
	operator?: string
	interval?: number
	time?: string
}

interface AutomationDetailsData {
	name: string
	describe: string
	sort: number
	status: string
	config: string
	type: number
}

type AutomationDetailsRes = ApiResponse<AutomationDetailsData>
type AutomationShowRes = ApiResponse<ConditionItem[]>
type AssetListRes = ApiResponse<EqpGroupItem[]>
type AssetDevicesRes = ApiResponse<{ devices: EqpItem[] }>

const { t } = useI18n()
const { apiRequest } = useInjected()

const toast = reactive<{ msg: string }>({ msg: '' })
const toastRef = ref<any>(null)

const showMsg = (msg: string) => {
	toast.msg = msg
	toastRef.value?.show?.()
}

const getPickerValue = (e: any) => e?.detail?.value ?? e?.target?.value ?? ''

// template refs
const conditionType = ref<PopupLike | null>(null)
const eqpGroups = ref<PopupLike | null>(null)
const eqpPopup = ref<PopupLike | null>(null)
const conditionPopup = ref<PopupLike | null>(null)
const symbolPopup = ref<PopupLike | null>(null)
const relationshipPopup = ref<PopupLike | null>(null)
const cishuPopup = ref<PopupLike | null>(null)
const addtrigPopup = ref<PopupLike | null>(null)
const addConPopup = ref<PopupLike | null>(null)

const addType = ref<string>('') // 新增弹窗上下文
const type = ref<string>('') // 列表编辑上下文

const editId = ref<string>('')

const addTrigForm = reactive<TrigForm>({
	eqpGroup: '',
	eqpGroupName: '',
	eqp: '',
	eqpName: '',
	condition: '',
	conditionName: '',
	filedType: '',
	symbol: '',
	symbolName: '',
	trigNum: '',
	relationship: '',
	relationshipName: '',
	cishu: 0,
	cishuName: t('pages.addControl.single') as string,
	dateTime: ''
})

const addConForm = reactive<ConForm>({
	eqpGroup: '',
	eqpGroupName: '',
	eqp: '',
	eqpName: '',
	condition: '',
	conditionName: '',
	filedType: '',
	conNum: '',
	relationship: '',
	relationshipName: ''
})

const trigList = ref<TrigItem[]>([
	{
		conditionType: 1,
		conditionTypeName: t('pages.addControl.deviceConditionType') as string,
		eqpGroup: '',
		eqpGroupName: '',
		eqp: '',
		eqpName: '',
		condition: '',
		conditionName: '',
		filedType: '',
		symbol: '',
		symbolName: '',
		trigNum: '',
		relationship: '',
		relationshipName: '',
		cishu: 0,
		cishuName: t('pages.addControl.single') as string,
		dateTime: ''
	}
])

const controlList = ref<ConItem[]>([
	{
		eqpGroup: '',
		eqpGroupName: '',
		eqp: '',
		eqpName: '',
		condition: '',
		conditionName: '',
		filedType: '',
		conNum: ''
	}
])

const relationshipList = ref<RelationshipItem[]>([
	{ name: t('pages.addControl.and') as string, id: '&&' },
	{ name: t('pages.addControl.or') as string, id: '||' }
])

const conditionList = ref<ConditionItem[]>([])
const eqpGroupsList = ref<EqpGroupItem[]>([])

const conditionTypeList = ref<ConditionTypeItem[]>([
	{ label: t('pages.addControl.deviceConditionType') as string, value: 1 },
	{ label: t('pages.addControl.timeConditionType') as string, value: 2 }
])

const symbolList = ref<SymbolItem[]>([
	{ name: t('pages.addControl.greaterThan') as string, id: '>' },
	{ name: t('pages.addControl.lessThan') as string, id: '<' },
	{ name: t('pages.addControl.equal') as string, id: '=' },
	{ name: t('pages.addControl.greaterThanOrEqual') as string, id: '≥' },
	{ name: t('pages.addControl.lessThanOrEqual') as string, id: '≤' }
])

const switchOnTwo = ref<number>(0)
const switchCloseTwo = ref<number>(1)
const switchOnOne = ref<number>(0) // NOTE: 原逻辑引用但页面未展示，保留默认值

const loading = ref<boolean>(false)
const disabled = ref<boolean>(false)

const eqpList = ref<EqpItem[]>([])
const currentEqp = ref<Record<string, unknown>>({})

const formData = reactive({
	describe: '',
	name: '',
	sort: 100
})

const currentTrigData = ref<any>({})
const currentConData = ref<any>({})

const cishuList = ref<TimesItem[]>([
	{ name: t('pages.addControl.single') as string, id: 0 },
	{ name: t('pages.addControl.everyDay') as string, id: 1 }
])

onShow(() => {
	uni.setNavigationBarTitle({
		title: t('pages.editControlStrategy') as string
	})
})

onLoad((options) => {
	const opt = options as Record<string, string | undefined>
	editId.value = opt.id || ''
	void getInfo()
})

const getInfo = async () => {
	const req = apiRequest
	if (!req) return

	uni.showLoading({
		title: t('pages.addControl.loading') as string
	})

	try {
		const res = (await req<AutomationDetailsData>('/api/automation/details', { id: editId.value }, 'post')) as AutomationDetailsRes
		if (res.code !== 200) {
			showMsg(res.message || '')
			return
		}

		formData.name = res.data.name
		formData.describe = res.data.describe
		formData.sort = res.data.sort

		if (res.data.status === '1') {
			switchOnTwo.value = 0 // 开
			switchCloseTwo.value = 1
		} else {
			switchOnTwo.value = 1 // 关
			switchCloseTwo.value = 0
		}

		const parsed = JSON.parse(res.data.config) as { rules: AutomationRuleItem[]; apply: AutomationRuleItem[] }
		const rules = parsed.rules || []
		const applys = parsed.apply || []

		const trigNext: TrigItem[] = []
		const controlNext: ConItem[] = []

		if (res.data.type === 1) {
			rules.forEach((item, index) => {
				trigNext.push({
					conditionType: index === 0 ? res.data.type : '',
					conditionTypeName:
						index === 0
							? (conditionTypeList.value.filter((c) => c.value === res.data.type)[0]?.label as string)
							: '',
					eqpGroup: item.asset_id,
					eqpGroupName: '',
					eqp: item.device_id,
					eqpName: '',
					condition: item.field,
					conditionName: '',
					filedType: '',
					symbol: item.condition || '',
					symbolName: '',
					trigNum: item.value || '',
					relationship: index !== 0 ? item.operator || '' : '',
					relationshipName:
						index !== 0 && item.operator
							? (relationshipList.value.filter((c) => c.id === item.operator)[0]?.name as string)
							: '',
					cishu: 0,
					cishuName: t('pages.addControl.single') as string,
					dateTime: ''
				})
			})
			trigList.value = trigNext

			applys.forEach((item) => {
				controlNext.push({
					eqpGroup: item.asset_id,
					eqpGroupName: '',
					eqp: item.device_id,
					eqpName: '',
					condition: item.field,
					conditionName: '',
					filedType: '',
					conNum: item.value || ''
				})
			})
			controlList.value = controlNext

			// 设备分组
			await toSelectEqpGroup({}, 'edit')

			trigList.value.forEach((it) => {
				void toSelectEqp(it, 'edit') // 设备
				void toSelectCondition(it, 'edit')
				symbolList.value.forEach((sy) => {
					if (sy.id === it.symbol) {
						it.symbolName = sy.name
					}
				})
			})

			controlList.value.forEach((it) => {
				void toSelectEqp(it, 'edit') // 设备
				void toSelectCondition(it, 'edit')
				symbolList.value.forEach((sy) => {
					// NOTE: 原逻辑对执行命令也尝试匹配 symbol，保持兼容
					if (sy.id === (it as any).symbol) {
						;(it as any).symbolName = sy.name
					}
				})
			})
		} else {
			rules.forEach((item, index) => {
				trigNext.push({
					cishu: Number(item.interval || 0),
					cishuName: cishuList.value.filter((c) => c.id === item.interval)[0]?.name,
					dateTime: item.time || '',
					relationship: index !== 0 ? '' : item.operator || '',
					relationshipName:
						index !== 0
							? ''
							: relationshipList.value.filter((c) => c.id === item.operator)[0]?.name,
					conditionType: index === 0 ? res.data.type : '',
					conditionTypeName:
						index === 0
							? conditionTypeList.value.filter((c) => res.data.type === c.value)[0]?.label
							: ''
				})
			})
			trigList.value = trigNext

			const apply = (JSON.parse(res.data.config) as any).apply as AutomationRuleItem[]
			const controlBlank: ConItem[] = []
			apply.forEach(() => {
				controlBlank.push({
					eqpGroup: '',
					eqpGroupName: '',
					eqp: '',
					eqpName: '',
					condition: '',
					conditionName: '',
					filedType: '',
					conNum: ''
				})
			})
			controlList.value = controlBlank
		}
	} finally {
		uni.hideLoading()
	}
}

const changeLog = (e: unknown) => {
	// eslint-disable-next-line no-console
	console.log('change事件:', e)
}

const bindTimeChangeAdd = (e: unknown) => {
	// eslint-disable-next-line no-console
	console.log('change事件:', e)
	addTrigForm.dateTime = String(getPickerValue(e))
}

const bindTimeChange = (data: any, e: unknown) => {
	const v = String(getPickerValue(e))
	if (addType.value) addTrigForm.dateTime = v
	else if (type.value) data.dateTime = v
}

const validate = () => {
	const control = controlList.value.filter((item) => !item.eqpGroup || !item.eqp || !item.condition || !item.conNum)

	if (formData.name === '') {
		showMsg(t('pages.addControl.validateError.nameRequired') as string)
		return false
	}
	if (formData.describe === '') {
		showMsg(t('pages.addControl.validateError.descriptionRequired') as string)
		return false
	}

	if ((trigList.value[0] as any)?.conditionType === 1) {
		const trig = trigList.value.filter((item, index) => {
			if (index === 0) {
				return !item.conditionType || !item.eqpGroup || !item.eqp || !item.condition || !item.symbol || !item.trigNum
			}
			return !item.eqpGroup || !item.eqp || !item.condition || !item.symbol || !item.trigNum || !item.relationship
		})
		if (trig.length > 0) {
			showMsg(t('pages.addControl.validateError.triggerConditionInvalid') as string)
			return false
		}
	} else {
		const trig = trigList.value.filter((item) => !item.cishuName || !item.dateTime)
		if (trig.length > 0) {
			showMsg(t('pages.addControl.validateError.triggerConditionInvalid') as string)
			return false
		}
	}

	if (control.length > 0) {
		showMsg(t('pages.addControl.validateError.executeCommandInvalid') as string)
		return false
	}
	return true
}

//保存策略
const doUpdateSubmit = async () => {
	const req = apiRequest
	if (!req) return

	if (!validate()) return

	let statusValue: number
	if (switchOnTwo.value === 0) statusValue = 1
	else statusValue = 0

	// 保留原逻辑：switchOnOne 参与计算但未使用
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const _switchOnOne = switchOnOne.value === 0 ? 1 : 0

	uni.showLoading({
		title: t('pages.addControl.loading') as string
	})

	try {
		const trigPayload: Record<string, unknown>[] = []
		if ((trigList.value[0] as any)?.conditionType === 1) {
			trigList.value.forEach((item) => {
				trigPayload.push({
					asset_id: item.eqpGroup,
					device_id: item.eqp,
					field: item.condition,
					field_type: item.filedType,
					duration: '0',
					condition: item.symbol,
					value: item.trigNum,
					operator: item.relationship ? item.relationship : ''
				})
			})
		} else {
			trigList.value.forEach((item) => {
				trigPayload.push({
					interval: item.cishu,
					time: item.dateTime,
					operator: item.relationship ? item.relationship : ''
				})
			})
		}

		const controlPayload: Record<string, unknown>[] = []
		controlList.value.forEach((item) => {
			controlPayload.push({
				asset_id: item.eqpGroup,
				device_id: item.eqp,
				field: item.condition,
				field_type: item.filedType,
				value: item.conNum,
				field_symbol: (item as any).field_symbol
			})
		})

		const params: Record<string, unknown> = {
			business_id: uni.getStorageSync('ywId'),
			status: statusValue,
			name: formData.name,
			sort: formData.sort,
			type: (trigList.value[0] as any)?.conditionType,
			describe: formData.describe,
			issued: '0',
			config: JSON.stringify({
				rules: trigPayload,
				apply: controlPayload
			}),
			id: editId.value
		}

		const res = await req<unknown>('/api/automation/edit', params, 'post')
		showMsg(res.message || '')
		if (res.code === 200) {
			uni.navigateBack(-1)
		}
	} finally {
		uni.hideLoading()
	}
}

const toDeltrig = (_data: unknown, index: number) => {
	trigList.value.forEach((_item, itemIndex) => {
		if (itemIndex === index) {
			trigList.value.splice(index, 1)
		}
	})
}

const toDelCon = (_data: unknown, index: number) => {
	controlList.value.forEach((_item, itemIndex) => {
		if (itemIndex === index) {
			controlList.value.splice(index, 1)
		}
	})
}

const confirmrCishu = (item: TimesItem) => {
	if (addType.value === 'trig') {
		addTrigForm.cishu = item.id
		addTrigForm.cishuName = item.name
		addtrigPopup.value?.open?.()
	} else if (type.value === 'trig') {
		currentTrigData.value.cishu = item.id
		currentTrigData.value.cishuName = item.name
	}
	cishuPopup.value?.close?.()
}

const toSelectCishuAdd = () => {
	addType.value = 'trig'
	type.value = ''
	addtrigPopup.value?.close?.()
	cishuPopup.value?.open?.()
}

const toSelectCishu = (data: any) => {
	type.value = 'trig'
	addType.value = ''
	currentTrigData.value = data
	cishuPopup.value?.open?.()
}

const confirmrRelationship = (item: RelationshipItem) => {
	if (addType.value === 'trig') {
		addTrigForm.relationship = item.id
		addTrigForm.relationshipName = item.name
		addtrigPopup.value?.open?.()
	} else if (addType.value === 'con') {
		addConForm.relationship = item.id
		addConForm.relationshipName = item.name
		addConPopup.value?.open?.()
	}
	relationshipPopup.value?.close?.()
}

const relationship = (v: string) => {
	addType.value = v
	type.value = ''
	if (v === 'con') addConPopup.value?.close?.()
	else if (v === 'trig') addtrigPopup.value?.close?.()
	relationshipPopup.value?.open?.()
}

const saveConValidate = () => {
	if (!addConForm.eqpGroup) {
		showMsg(t('pages.addControl.validateError.deviceGroupRequired') as string)
		return false
	}
	if (!addConForm.eqp) {
		showMsg(t('pages.addControl.validateError.deviceRequired') as string)
		return false
	}
	if (!addConForm.condition) {
		showMsg(t('pages.addControl.validateError.conditionRequired') as string)
		return false
	}
	if (!addConForm.conNum) {
		showMsg(t('pages.addControl.inputValue') as string)
		return false
	}
	return true
}

const saveTrigValidate = () => {
	if ((trigList.value[0] as any)?.conditionType === 1) {
		if (!addTrigForm.relationship) {
			showMsg(t('pages.addControl.selectConditionAndOr') as string)
			return false
		}
		if (!addTrigForm.eqpGroup) {
			showMsg(t('pages.addControl.validateError.deviceGroupRequired') as string)
			return false
		}
		if (!addTrigForm.eqp) {
			showMsg(t('pages.addControl.validateError.deviceRequired') as string)
			return false
		}
		if (!addTrigForm.condition) {
			showMsg(t('pages.addControl.validateError.conditionRequired') as string)
			return false
		}
		if (!addTrigForm.symbol) {
			showMsg(t('pages.addControl.validateError.symbolRequired') as string)
			return false
		}
		if (!addTrigForm.trigNum) {
			showMsg(t('pages.addControl.inputValue') as string)
			return false
		}
	} else {
		if (!addTrigForm.relationship) {
			showMsg(t('pages.addControl.selectConditionAndOr') as string)
			return false
		}
		if (!addTrigForm.cishuName) {
			showMsg(t('pages.addControl.validateError.timesRequired') as string)
			return false
		}
		if (!addTrigForm.dateTime) {
			showMsg(t('pages.addControl.validateError.dateTimeRequired') as string)
			return false
		}
	}
	return true
}

const saveTrig = () => {
	if (saveTrigValidate()) {
		if ((trigList.value[0] as any)?.conditionType === 1) {
			trigList.value.push({
				eqpGroup: addTrigForm.eqpGroup,
				eqpGroupName: addTrigForm.eqpGroupName,
				eqp: addTrigForm.eqp,
				eqpName: addTrigForm.eqpName,
				condition: addTrigForm.condition,
				conditionName: addTrigForm.conditionName,
				filedType: addTrigForm.filedType,
				symbol: addTrigForm.symbol,
				symbolName: addTrigForm.symbolName,
				trigNum: addTrigForm.trigNum,
				relationship: addTrigForm.relationship,
				relationshipName: addTrigForm.relationshipName
			})
		} else {
			trigList.value.push({
				cishu: addTrigForm.cishu,
				cishuName: addTrigForm.cishuName,
				dateTime: addTrigForm.dateTime,
				relationship: addTrigForm.relationship,
				relationshipName: addTrigForm.relationshipName
			})
		}
		addtrigPopup.value?.close?.()
		// Vue2 里使用 $forceUpdate；这里通过变更数组引用保持刷新一致
		trigList.value = trigList.value.slice()
	}
}

const saveCon = () => {
	if (saveConValidate()) {
		controlList.value.push({
			eqpGroup: addConForm.eqpGroup,
			eqpGroupName: addConForm.eqpGroupName,
			eqp: addConForm.eqp,
			eqpName: addConForm.eqpName,
			condition: addConForm.condition,
			conditionName: addConForm.conditionName,
			filedType: addConForm.filedType,
			conNum: addConForm.conNum
		})
		addConPopup.value?.close?.()
		controlList.value = controlList.value.slice()
	}
}

const confirmSymbol = (item: SymbolItem) => {
	if (type.value) {
		if (type.value === 'trig') {
			currentTrigData.value.symbol = item.id
			currentTrigData.value.symbolName = item.name
		} else if (type.value === 'con') {
			currentConData.value.symbol = item.key
			currentConData.value.symbolName = item.name
		}
		symbolPopup.value?.close?.()
	} else if (addType.value) {
		if (addType.value === 'trig') {
			addTrigForm.symbol = item.id
			addTrigForm.symbolName = item.name
			addtrigPopup.value?.open?.()
		} else if (addType.value === 'con') {
			;(addConForm as any).symbol = item.key
			;(addConForm as any).symbolName = item.name
			addConPopup.value?.open?.()
		}
		symbolPopup.value?.close?.()
	}
}

const toSelectSymbolAdd = (v: string) => {
	addType.value = v
	type.value = ''
	if (v === 'trig') addtrigPopup.value?.close?.()
	else if (v === 'con') addConPopup.value?.close?.()
	// eslint-disable-next-line no-console
	console.log('==')
	symbolPopup.value?.open?.()
}

const toSelectSymbol = (data: any, v: string) => {
	type.value = v
	addType.value = ''
	if (v === 'trig') currentTrigData.value = data
	else if (v === 'con') currentConData.value = data
	symbolPopup.value?.open?.()
}

const confirmCondition = (item: ConditionItem) => {
	if (type.value) {
		if (type.value === 'trig') {
			currentTrigData.value.condition = item.key
			currentTrigData.value.conditionName = item.name
			currentTrigData.value.filedType = item.type
			currentTrigData.value.field_symbol = item.symbol
		} else if (type.value === 'con') {
			currentConData.value.condition = item.key
			currentConData.value.conditionName = item.name
			currentConData.value.filedType = item.type
			currentConData.value.field_symbol = item.symbol
		}
	} else if (addType.value) {
		if (addType.value === 'trig') {
			addTrigForm.condition = item.key
			addTrigForm.conditionName = item.name
			addTrigForm.filedType = item.type
			addTrigForm.field_symbol = item.symbol
			addtrigPopup.value?.open?.()
		} else if (addType.value === 'con') {
			addConForm.condition = item.key
			addConForm.conditionName = item.name
			addConForm.filedType = item.type
			addConForm.field_symbol = item.symbol
			addConPopup.value?.open?.()
		}
	}
	conditionPopup.value?.close?.()
}

const toSelectConditionAdd = async (v: string) => {
	addType.value = v
	type.value = ''

	if ((trigList.value[0] as any)?.conditionType === 1) {
		if (v === 'trig') {
			if (!addTrigForm.eqp) {
				showMsg(t('pages.addControl.validateError.deviceRequired') as string)
				return
			}
		} else if (v === 'con') {
			if (!addConForm.eqp) {
				showMsg(t('pages.addControl.validateError.deviceRequired') as string)
				return
			}
		}
	}

	const req = apiRequest
	if (!req) return

	uni.showLoading({
		title: t('pages.addControl.loading') as string
	})

	try {
		const bid = v === 'trig' ? addTrigForm.eqp : addConForm.eqp
		const res = (await req<ConditionItem[]>('/api/automation/show', { bid }, 'post')) as AutomationShowRes
		if (res.code === 200) {
			if (res.data && res.data.length > 0) {
				conditionList.value = res.data
				if (v === 'trig') addtrigPopup.value?.close?.()
				else if (v === 'con') addConPopup.value?.close?.()
				conditionPopup.value?.open?.()
			} else {
				showMsg(t('pages.addControl.noData') as string)
			}
		}
	} finally {
		uni.hideLoading()
	}
}

const toSelectCondition = async (data: any, v: string) => {
	type.value = v
	addType.value = ''

	if ((trigList.value[0] as any)?.conditionType === 1) {
		if (v === 'trig') currentTrigData.value = data
		else if (v === 'con') currentConData.value = data
	}

	if (!data.eqp) {
		showMsg(t('pages.addControl.validateError.deviceRequired') as string)
		return
	}

	const req = apiRequest
	if (!req) return

	uni.showLoading({
		title: t('pages.addControl.loading') as string
	})

	try {
		const res = (await req<ConditionItem[]>('/api/automation/show', { bid: data.eqp }, 'post')) as AutomationShowRes
		if (res.code === 200) {
			if (res.data && res.data.length > 0) {
				if (v === 'edit') {
					res.data.forEach((it) => {
						trigList.value.forEach((list) => {
							if (it.key === list.condition) {
								list.conditionName = it.name
								list.filedType = it.type
							}
						})
						controlList.value.forEach((list) => {
							if (it.key === list.condition) {
								list.conditionName = it.name
								list.filedType = it.type
							}
						})
					})
				} else {
					conditionPopup.value?.open?.()
				}
				conditionList.value = res.data
			} else {
				showMsg(t('pages.addControl.noData') as string)
			}
		}
	} finally {
		uni.hideLoading()
	}
}

const comfirEqp = (item: EqpItem) => {
	if (type.value) {
		if (type.value === 'trig') {
			currentTrigData.value.eqp = item.device_id
			currentTrigData.value.condition = ''
			currentTrigData.value.conditionName = ''
			currentTrigData.value.eqpName = item.name
		} else if (type.value === 'con') {
			currentConData.value.condition = ''
			currentConData.value.conditionName = ''
			currentConData.value.eqp = item.device_id
			currentConData.value.eqpName = item.name
		}
		eqpPopup.value?.close?.()
	} else if (addType.value) {
		if (addType.value === 'trig') {
			addTrigForm.eqp = item.device_id
			addTrigForm.eqpName = item.name
			addTrigForm.condition = ''
			addTrigForm.conditionName = ''
			addtrigPopup.value?.open?.()
		} else if (addType.value === 'con') {
			addConForm.eqp = item.device_id
			addConForm.eqpName = item.name
			addConForm.condition = ''
			addConForm.conditionName = ''
			addConPopup.value?.open?.()
		}
		eqpPopup.value?.close?.()
	}
}

const toSelectEqpAdd = async (v: string) => {
	addType.value = v

	if ((trigList.value[0] as any)?.conditionType === 1) {
		if (v === 'trig') {
			if (!addTrigForm.eqpGroup) {
				showMsg(t('pages.addControl.validateError.deviceGroupRequired') as string)
				return
			}
		} else if (v === 'con') {
			if (!addConForm.eqpGroup) {
				showMsg(t('pages.addControl.validateError.deviceGroupRequired') as string)
				return
			}
		}
	}

	const req = apiRequest
	if (!req) return

	uni.showLoading({
		title: t('pages.addControl.loading') as string
	})

	try {
		const asset_id = v === 'trig' ? addTrigForm.eqpGroup : addConForm.eqpGroup
		const res = (await req<{ devices: EqpItem[] }>('/api/kv/current/asset/a', { asset_id }, 'post')) as AssetDevicesRes
		if (res.code === 200) {
			if (res.data && res.data.devices.length > 0) {
				eqpList.value = res.data.devices
				if (v === 'trig') addtrigPopup.value?.close?.()
				else if (v === 'con') addConPopup.value?.close?.()
				eqpPopup.value?.open?.()
			} else {
				showMsg(t('pages.addControl.noData') as string)
			}
		}
	} finally {
		uni.hideLoading()
	}
}

const toSelectEqp = async (data: any, v: string) => {
	type.value = v
	addType.value = ''
	if (v === 'trig') currentTrigData.value = data
	else if (v === 'con') currentConData.value = data

	const req = apiRequest
	if (!req) return

	uni.showLoading({
		title: t('pages.addControl.loading') as string
	})

	try {
		const res = (await req<{ devices: EqpItem[] }>('/api/kv/current/asset/a', { asset_id: data.eqpGroup }, 'post')) as AssetDevicesRes
		if (res.code === 200) {
			if (res.data && res.data.devices.length > 0) {
				if (v === 'edit') {
					res.data.devices.forEach((it) => {
						trigList.value.forEach((list) => {
							if (it.device_id === list.eqp) list.eqpName = it.name
						})
						controlList.value.forEach((list) => {
							if (it.device_id === list.eqp) list.eqpName = it.name
						})
					})
				} else {
					eqpPopup.value?.open?.()
				}
				eqpList.value = res.data.devices
			} else {
				showMsg(t('pages.addControl.noData') as string)
			}
		}
	} finally {
		uni.hideLoading()
	}
}

const toConfirmeqpGroup = (item: EqpGroupItem) => {
	if (type.value) {
		if (type.value === 'trig') {
			currentTrigData.value.eqpGroup = item.id
			currentTrigData.value.eqpGroupName = item.device_group
			currentTrigData.value.eqp = ''
			currentTrigData.value.eqpName = ''
			currentTrigData.value.condition = ''
			currentTrigData.value.conditionName = ''
		} else if (type.value === 'con') {
			currentConData.value.eqpGroup = item.id
			currentConData.value.eqpGroupName = item.device_group
			currentConData.value.eqp = ''
			currentConData.value.eqpName = ''
			currentConData.value.condition = ''
			currentConData.value.conditionName = ''
		}
		eqpGroups.value?.close?.()
	} else if (addType.value) {
		if (addType.value === 'trig') {
			addTrigForm.eqp = ''
			addTrigForm.eqpName = ''
			addTrigForm.condition = ''
			addTrigForm.conditionName = ''
			addTrigForm.eqpGroup = item.id
			addTrigForm.eqpGroupName = item.device_group
			addtrigPopup.value?.open?.()
		} else if (addType.value === 'con') {
			addConForm.eqp = ''
			addConForm.eqpName = ''
			addConForm.condition = ''
			addConForm.conditionName = ''
			addConForm.eqpGroup = item.id
			addConForm.eqpGroupName = item.device_group
			addConPopup.value?.open?.()
		}
		eqpGroups.value?.close?.()
	}
}

const toSelectEqpGroup = async (data: any, v: string) => {
	type.value = v
	addType.value = ''
	if (v === 'trig') currentTrigData.value = data
	else if (v === 'con') currentConData.value = data

	const req = apiRequest
	if (!req) return

	uni.showLoading({
		title: t('pages.addControl.loading') as string
	})

	try {
		const res = (await req<EqpGroupItem[]>('/api/asset/list/d', { business_id: uni.getStorageSync('ywId') }, 'post')) as AssetListRes
		if (res.code === 200) {
			if (res.data && res.data.length > 0) {
				if (v === 'edit') {
					trigList.value.forEach((list) => {
						res.data.forEach((it) => {
							if (it.id === list.eqpGroup) list.eqpGroupName = it.device_group
						})
					})
					// eslint-disable-next-line no-console
					console.log('controlList==', controlList.value)
					controlList.value.forEach((list) => {
						res.data.forEach((it) => {
							if (it.id === list.eqpGroup) {
								// eslint-disable-next-line no-console
								console.log('list==', list)
								list.eqpGroupName = it.device_group
							}
						})
					})
				} else {
					eqpGroups.value?.open?.()
				}
				eqpGroupsList.value = res.data
			} else {
				showMsg(t('pages.addControl.noData') as string)
			}
		}
	} finally {
		uni.hideLoading()
	}
}

const toSelectEqpGroupAdd = async (v: string) => {
	addType.value = v
	type.value = ''

	const req = apiRequest
	if (!req) return

	uni.showLoading({
		title: t('pages.addControl.loading') as string
	})

	try {
		const res = (await req<EqpGroupItem[]>('/api/asset/list/d', { business_id: uni.getStorageSync('ywId') }, 'post')) as AssetListRes
		if (res.code === 200) {
			if (res.data && res.data.length > 0) {
				eqpGroupsList.value = res.data
				if (v === 'trig') addtrigPopup.value?.close?.()
				else if (v === 'con') addConPopup.value?.close?.()
				eqpGroups.value?.open?.()
			} else {
				showMsg(t('pages.addControl.noData') as string)
			}
		}
	} finally {
		uni.hideLoading()
	}
}

const toSelectConditionType = (data: any, v: string) => {
	type.value = v
	addType.value = ''
	if (v === 'trig') currentTrigData.value = data
	else if (v === 'con') currentConData.value = data
	currentTrigData.value = data
	conditionType.value?.open?.()
}

const comfirConditionType = (item: ConditionTypeItem) => {
	if (type.value === 'trig') {
		currentTrigData.value.conditionType = item.value
		currentTrigData.value.conditionTypeName = item.label
	} else if (type.value === 'con') {
		currentConData.value.conditionType = item.value
		currentConData.value.conditionTypeName = item.label
	}
	conditionType.value?.close?.()
}

const toAddCon = () => {
	addConPopup.value?.open?.()
}

const toAddtrig = () => {
	addtrigPopup.value?.open?.()
}
</script>

<style scoped lang="css">
	@import '@/common/styles/add-control.css';

	.uni-date__x-input {
		text-align: right;
	}

	.uni-date-x--border {
		border: none
	}

	::v-deep .uni-icons {
		display: none !important;
	}

	.input_num {
		margin-top: 35rpx;
		text-align: right;
	}

	.tp-panel .info_header {
		width: 100% !important;
		height: 100rpx !important;
		line-height: 100rpx !important;
	}

	.del_btn {
		font-size: 26rpx !important;
		font-family: Source Han Sans CN !important;
		font-weight: 500 !important;
		color: #DB2A2A !important;
		width: 100% !important;
		text-align: center !important;
	}

	.del_btn image {
		width: 32rpx !important;
		height: 32rpx !important;
		margin-right: 7rpx !important;
		vertical-align: text-bottom;
	}
</style>
