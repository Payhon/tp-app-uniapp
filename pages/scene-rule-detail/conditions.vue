<template>
  <view >
    <view class="tp-mg-l-r-30" v-for="(condition, index) in conditions" :key="condition.$index">
      <!-- 选择且或关系 -->
      <view class='tp-mg-t-b-10' v-if="index !== 0">
        <uni-data-checkbox :localdata="relations" v-model="condition._relation" />
      </view>
      
      <view class="tp-flex tp-flex-row">
        <view style="align-self: center;" class="tp-panel tp-flex-1 feedback-body">
          <CustomSelect
            class="item2"
            :placeholder="$t('pages.sceneRuleDetail.conditionType')"
            :options="conditionTypeOptions"
            @change="conditionTypeChange($event, index)"
            v-model="condition.condition_type"
          ></CustomSelect>
          
          <!-- 设备条件 -->
          <SelectDevice class="item2" key="SelectDevice" v-if="condition.condition_type === '1'" :data="condition"></SelectDevice>
          
          <!-- 时间条件 -->
          <SelectTime class="item2" key="SelectTime" v-if="condition.condition_type === '2'" :data="condition"></SelectTime>
        </view>
        
        <view style="width:64rpx" class="tp-flex tp-flex-col tp-flex-j-c tp-mg-l-10">
          <!-- 条件数量大于1条时才允许删除 -->
          <uni-icons 
            v-if="conditions.length > 1" 
            class="tp-mg-t-b-10" 
            type="minus" 
            size="40rpx" 
            color="red"
            @click="removeCondition(condition, index)"
          ></uni-icons>
          
          <uni-icons
            class="tp-mg-t-b-10" 
            type="plus" 
            size="40rpx"
            color="#2979ff"
            @click="addCondition(condition, index)"
          ></uni-icons>
        </view>
      </view>
    </view>
    
    <!-- 消息提示框 -->
    <cys-toast ref="toastRef" :msg="toast.msg" location="top"></cys-toast>
  </view>
  
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { useI18n } from 'vue-i18n'
  import CustomSelect from '@/components/custom-select.vue'
  import SelectDevice from '@/components/select-device'
  import SelectTime from '@/components/select-time'

  type Relation = '' | 'and' | 'or'
  type ConditionType = '' | '1' | '2'

  export type Condition = {
    $index?: number
    _relation?: Relation
    group_number?: number | ''
    condition_type?: ConditionType

    business_id?: string
    asset_id?: string
    device_id?: string
    device_condition_type?: string

    time_condition_type?: string
    v1?: string
    v2?: string
    v3?: string
    v4?: string
    v5?: string
    remark?: string
    id?: string | number
  }

  type Props = {
    list?: Condition[]
  }

  const props = withDefaults(defineProps<Props>(), {
    list: () => ([]),
  })

  const { t } = useI18n()

  const toast = ref<{ msg: string }>({ msg: '' })
  const toastRef = ref<any>(null)

  const relations = computed(() => [
    { text: t('pages.sceneRuleDetail.and'), value: 'and' },
    { text: t('pages.sceneRuleDetail.or'), value: 'or' },
  ])

  const conditionTypeOptions = computed(() => [
    { value: '1', label: t('pages.sceneRuleDetail.deviceCondition') },
    { value: '2', label: t('pages.sceneRuleDetail.timeCondition') },
  ])

  const conditions = ref<Condition[]>([])

  const transRelation = (automation_conditions: Condition[]) => {
    if (!automation_conditions?.length) return
    automation_conditions[0].$index = Math.random()

    if (automation_conditions.length > 1) {
      for (let i = 1; i < automation_conditions.length; i += 1) {
        const preCondition = automation_conditions[i - 1]
        const currCondition = automation_conditions[i]

        currCondition._relation = currCondition.group_number === preCondition.group_number ? 'and' : 'or'
        currCondition.$index = Math.random()
      }
    }
  }

  const initConditions = (list: Condition[]) => {
    const cloned = JSON.parse(JSON.stringify(list || [])) as Condition[]
    transRelation(cloned)
    conditions.value = cloned
  }

  const conditionTypeChange = (condition_type: ConditionType, index: number) => {
    console.log(condition_type, index)
    const condition = conditions.value[index] || {}
    conditions.value[index] = {
      condition_type,

      business_id: '',
      asset_id: '',
      device_id: '',
      device_condition_type: '',

      time_condition_type: '',
      v1: '',
      v2: '',
      v3: '',
      v4: '',
      v5: '',

      remark: '',
      group_number: condition.group_number,
      _relation: condition._relation,
      id: condition.id,
      $index: condition.$index,
    }
  }

  const removeCondition = (currCondition: Condition, index: number) => {
    console.log(currCondition, index)
    conditions.value.splice(index, 1)
  }

  const addCondition = (currCondition: Condition, index: number) => {
    conditions.value.splice(index + 1, 0, {
      $index: Math.random(),
    })
    console.log(conditions.value)
  }

  const transGroupNumber = (automation_conditions: Condition[]) => {
    let invalidRelationNum = 0

    if (automation_conditions?.length) {
      automation_conditions[0].group_number = 1

      if (automation_conditions.length > 1) {
        for (let i = 1; i < automation_conditions.length; i += 1) {
          const preCondition = automation_conditions[i - 1]
          const currCondition = automation_conditions[i]

          if (!currCondition._relation) {
            invalidRelationNum = -1
            break
          } else if (currCondition._relation === 'and') {
            if (currCondition.condition_type === '2' && preCondition.condition_type === '2') {
              const arr = ['1', '2']
              if (arr.includes(currCondition.time_condition_type || '') && arr.includes(preCondition.time_condition_type || '')) {
                invalidRelationNum += 1
                currCondition._relation = ''
                currCondition.group_number = ''
              } else {
                currCondition.group_number = (preCondition.group_number as number) || 1
              }
            } else {
              currCondition.group_number = (preCondition.group_number as number) || 1
            }
          } else if (currCondition._relation === 'or') {
            currCondition.group_number = (((preCondition.group_number as number) || 1) + 1) as any
          }
        }
      }
    }

    if (invalidRelationNum < 0) return t('pages.sceneRuleDetail.selectRelation')
    if (invalidRelationNum > 0) return t('pages.sceneRuleDetail.timeConditionValidation')
    return ''
  }

  const submitData = (list: Condition[]) => {
    const cloned = JSON.parse(JSON.stringify(list || [])) as Condition[]
    return cloned.map((condition) => {
      const { condition_type, device_condition_type, device_id, group_number, v1, v2, v3, v4, time_condition_type } = condition
      return JSON.parse(
        JSON.stringify({
          condition_type,
          device_condition_type: device_condition_type || undefined,
          device_id: device_id || undefined,
          group_number,
          v1: v1 || undefined,
          v2: v2 || undefined,
          v3: v3 || undefined,
          v4: v4 || undefined,
          time_condition_type: time_condition_type || undefined,
        })
      )
    })
  }

  const getConditionsData = () => {
    console.log('conditons', JSON.parse(JSON.stringify(conditions.value)))

    let msg = ''
    for (let i = 0; i < conditions.value.length; i += 1) {
      const condition = conditions.value[i]
      console.log('conditon' + i, JSON.parse(JSON.stringify(condition)))
      const { condition_type, business_id, asset_id, device_id, device_condition_type, time_condition_type, v1, v2, v3, v4 } = condition

      if (!condition_type) {
        msg = t('pages.sceneRuleDetail.selectConditionType')
        break
      } else if (condition_type === '1') {
        if (!business_id || !asset_id || !device_id || !device_condition_type) {
          msg = t('pages.sceneRuleDetail.completeDeviceCondition')
          break
        }

        if (device_condition_type === '1' && (!v2 || !v3)) {
          msg = t('pages.sceneRuleDetail.completeDeviceCondition')
          break
        }
      } else if (condition_type === '2') {
        if (!time_condition_type) {
          msg = t('pages.sceneRuleDetail.completeTimeCondition')
          break
        } else if (time_condition_type === '0') {
          if (!v1 || !v2) {
            msg = t('pages.sceneRuleDetail.completeTimeCondition')
            break
          }
        } else if (time_condition_type === '1') {
          if (!v1) {
            msg = t('pages.sceneRuleDetail.completeTimeCondition')
            break
          }
        } else if (time_condition_type === '2') {
          console.log(v1)
          if (!v1) {
            msg = t('pages.sceneRuleDetail.completeTimeCondition')
            break
          } else if (v1 === '1') {
            if (!v3) {
              msg = t('pages.sceneRuleDetail.completeTimeCondition')
              break
            }
          } else if (v1 === '2') {
            if (!v3) {
              msg = t('pages.sceneRuleDetail.completeTimeCondition')
              break
            }
          } else if (v1 === '3') {
            if (!v3 || !v4) {
              msg = t('pages.sceneRuleDetail.completeTimeCondition')
              break
            }
          } else if (v1 === '4') {
            console.log(v3)
            const [dd, hh] = (v3 || '').split(':')
            if (!dd || !hh) {
              msg = t('pages.sceneRuleDetail.completeTimeCondition')
              break
            }
          } else if (v1 === '5') {
            console.log(1234)
            if (!v3) {
              msg = t('pages.sceneRuleDetail.completeTimeCondition')
              break
            }
          }
        }
      } else {
        msg = t('pages.sceneRuleDetail.unknownConditionType')
        break
      }
    }

    if (msg) return { result: msg }

    const msg2 = transGroupNumber(conditions.value)
    if (msg2) return { result: msg2 }
    return { result: true, conditions: submitData(conditions.value) }
  }

  defineExpose({ getConditionsData })

  watch(
    () => props.list,
    (n) => initConditions(n || []),
    { immediate: true, deep: true }
  )

  onMounted(() => {
    console.log(conditions.value)
  })
</script>

<style scoped>
  @import '@/common/styles/alert-strategy.css';
</style>

