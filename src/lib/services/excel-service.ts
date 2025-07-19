import * as XLSX from 'xlsx'
import { z } from 'zod'

export interface ExcelColumn {
  key: string
  header: string
  headerEn?: string
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'array'
  required?: boolean
  options?: Array<{ value: string; label: string }>
  format?: string // For date formatting
  transform?: (value: any) => any
}

export interface ExcelTemplate {
  name: string
  nameEn?: string
  description?: string
  sheets: Array<{
    name: string
    columns: ExcelColumn[]
    validation?: z.ZodType<any>
  }>
}

export interface ImportResult {
  success: boolean
  totalRows: number
  validRows: number
  invalidRows: number
  errors: Array<{
    row: number
    field: string
    message: string
  }>
  data: any[]
}

export class ExcelService {
  /**
   * Export data to Excel
   */
  static exportToExcel(
    data: any[],
    columns: ExcelColumn[],
    fileName: string,
    sheetName: string = 'Sheet1'
  ): Buffer {
    // Create workbook
    const wb = XLSX.utils.book_new()
    
    // Transform data according to column configuration
    const transformedData = data.map(row => {
      const transformedRow: any = {}
      
      for (const column of columns) {
        const value = row[column.key]
        let transformedValue = value
        
        if (column.transform) {
          transformedValue = column.transform(value)
        } else if (column.type === 'date' && value) {
          transformedValue = new Date(value).toLocaleDateString()
        } else if (column.type === 'boolean') {
          transformedValue = value ? '是' : '否'
        } else if (column.type === 'array' && Array.isArray(value)) {
          transformedValue = value.join(', ')
        } else if (column.type === 'select' && column.options && value) {
          const option = column.options.find(opt => opt.value === value)
          transformedValue = option ? option.label : value
        }
        
        transformedRow[column.header] = transformedValue
      }
      
      return transformedRow
    })
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(transformedData)
    
    // Set column widths
    const columnWidths = columns.map(col => ({
      wch: Math.max(col.header.length, 15)
    }))
    ws['!cols'] = columnWidths
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    
    // Write to buffer
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  }
  
  /**
   * Import data from Excel
   */
  static importFromExcel(
    buffer: Buffer,
    columns: ExcelColumn[],
    sheetName?: string,
    validation?: z.ZodType<any>
  ): ImportResult {
    try {
      // Read workbook
      const wb = XLSX.read(buffer, { type: 'buffer' })
      
      // Get sheet
      const sheet = sheetName ? wb.Sheets[sheetName] : wb.Sheets[wb.SheetNames[0]]
      if (!sheet) {
        throw new Error('Sheet not found')
      }
      
      // Convert to JSON
      const rawData = XLSX.utils.sheet_to_json(sheet)
      
      const result: ImportResult = {
        success: true,
        totalRows: rawData.length,
        validRows: 0,
        invalidRows: 0,
        errors: [],
        data: []
      }
      
      // Process each row
      rawData.forEach((row: any, index) => {
        const rowNumber = index + 2 // Excel rows start from 2 (after header)
        const processedRow: any = {}
        let hasError = false
        
        // Process each column
        for (const column of columns) {
          const cellValue = row[column.header]
          let value = cellValue
          
          // Type conversion
          try {
            if (column.type === 'number') {
              value = cellValue ? parseFloat(cellValue) : null
              if (isNaN(value)) {
                value = null
              }
            } else if (column.type === 'date') {
              if (cellValue) {
                if (typeof cellValue === 'number') {
                  // Excel date serial number
                  value = XLSX.SSF.parse_date_code(cellValue)
                } else {
                  value = new Date(cellValue)
                }
                if (isNaN(value.getTime())) {
                  value = null
                }
              } else {
                value = null
              }
            } else if (column.type === 'boolean') {
              value = cellValue === '是' || cellValue === 'true' || cellValue === '1' || cellValue === 1
            } else if (column.type === 'array') {
              value = cellValue ? cellValue.split(/[,，;；]/).map((s: string) => s.trim()) : []
            } else if (column.type === 'select') {
              // Try to find option by label first, then by value
              if (column.options && cellValue) {
                const option = column.options.find(opt => 
                  opt.label === cellValue || opt.value === cellValue
                )
                value = option ? option.value : cellValue
              }
            } else {
              value = cellValue ? String(cellValue).trim() : null
            }
            
            // Required field validation
            if (column.required && (value === null || value === '' || value === undefined)) {
              result.errors.push({
                row: rowNumber,
                field: column.key,
                message: `${column.header} 是必填项`
              })
              hasError = true
            }
            
            processedRow[column.key] = value
          } catch (error) {
            result.errors.push({
              row: rowNumber,
              field: column.key,
              message: `${column.header} 格式错误: ${error}`
            })
            hasError = true
          }
        }
        
        // Schema validation
        if (validation && !hasError) {
          try {
            validation.parse(processedRow)
          } catch (error) {
            if (error instanceof z.ZodError) {
              for (const issue of error.issues) {
                result.errors.push({
                  row: rowNumber,
                  field: issue.path.join('.'),
                  message: issue.message
                })
              }
              hasError = true
            }
          }
        }
        
        if (hasError) {
          result.invalidRows++
        } else {
          result.validRows++
          result.data.push(processedRow)
        }
      })
      
      result.success = result.invalidRows === 0
      
      return result
    } catch (error) {
      return {
        success: false,
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        errors: [{ row: 0, field: 'file', message: `导入失败: ${error}` }],
        data: []
      }
    }
  }
  
  /**
   * Create Excel template
   */
  static createTemplate(template: ExcelTemplate): Buffer {
    const wb = XLSX.utils.book_new()
    
    for (const sheet of template.sheets) {
      // Create header row
      const headerRow: any = {}
      for (const column of sheet.columns) {
        headerRow[column.header] = column.header
      }
      
      // Create sample row
      const sampleRow: any = {}
      for (const column of sheet.columns) {
        let sampleValue = ''
        
        switch (column.type) {
          case 'text':
            sampleValue = '示例文本'
            break
          case 'number':
            sampleValue = '100'
            break
          case 'date':
            sampleValue = '2024-01-01'
            break
          case 'boolean':
            sampleValue = '是'
            break
          case 'select':
            sampleValue = column.options?.[0]?.label || '选项1'
            break
          case 'array':
            sampleValue = '项目1, 项目2'
            break
        }
        
        sampleRow[column.header] = sampleValue
      }
      
      // Create worksheet
      const ws = XLSX.utils.json_to_sheet([sampleRow])
      
      // Set column widths
      const columnWidths = sheet.columns.map(col => ({
        wch: Math.max(col.header.length, 15)
      }))
      ws['!cols'] = columnWidths
      
      // Add comments for required fields
      for (let i = 0; i < sheet.columns.length; i++) {
        const column = sheet.columns[i]
        if (column.required) {
          const cellRef = XLSX.utils.encode_cell({ r: 0, c: i })
          if (!ws[cellRef]) ws[cellRef] = { v: column.header }
          ws[cellRef].c = [{
            a: 'System',
            t: '必填项',
            h: `${column.header} 是必填项`
          }]
        }
      }
      
      XLSX.utils.book_append_sheet(wb, ws, sheet.name)
    }
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  }
  
  /**
   * Validate Excel file structure
   */
  static validateStructure(
    buffer: Buffer,
    expectedColumns: ExcelColumn[],
    sheetName?: string
  ): { valid: boolean; errors: string[] } {
    try {
      const wb = XLSX.read(buffer, { type: 'buffer' })
      const sheet = sheetName ? wb.Sheets[sheetName] : wb.Sheets[wb.SheetNames[0]]
      
      if (!sheet) {
        return { valid: false, errors: ['工作表不存在'] }
      }
      
      const data = XLSX.utils.sheet_to_json(sheet)
      if (data.length === 0) {
        return { valid: false, errors: ['文件为空'] }
      }
      
      const actualColumns = Object.keys(data[0] as any)
      const expectedColumnNames = expectedColumns.map(col => col.header)
      
      const missingColumns = expectedColumnNames.filter(col => 
        !actualColumns.includes(col)
      )
      
      const errors: string[] = []
      if (missingColumns.length > 0) {
        errors.push(`缺少列: ${missingColumns.join(', ')}`)
      }
      
      return { valid: errors.length === 0, errors }
    } catch (error) {
      return { valid: false, errors: [`文件格式错误: ${error}`] }
    }
  }
}

// Pre-defined templates for common entities
export const excelTemplates = {
  // User import template
  users: {
    name: '用户导入模板',
    nameEn: 'User Import Template',
    description: '用于批量导入用户数据',
    sheets: [{
      name: '用户数据',
      columns: [
        { key: 'email', header: '邮箱', type: 'text' as const, required: true },
        { key: 'name', header: '姓名', type: 'text' as const, required: true },
        { key: 'nameEn', header: '英文姓名', type: 'text' as const },
        { key: 'studentId', header: '学号', type: 'text' as const },
        { key: 'phone', header: '手机号', type: 'text' as const },
        { key: 'department', header: '院系', type: 'text' as const },
        { key: 'roles', header: '角色', type: 'array' as const, required: true },
        { key: 'password', header: '初始密码', type: 'text' as const, required: true }
      ]
    }]
  },
  
  // Project import template
  projects: {
    name: '项目导入模板',
    nameEn: 'Project Import Template',
    description: '用于批量导入项目数据',
    sheets: [{
      name: '项目数据',
      columns: [
        { key: 'title', header: '项目标题', type: 'text' as const, required: true },
        { key: 'description', header: '项目描述', type: 'text' as const, required: true },
        { key: 'studentEmail', header: '学生邮箱', type: 'text' as const, required: true },
        { key: 'advisorEmail', header: '导师邮箱', type: 'text' as const, required: true },
        { key: 'startDate', header: '开始日期', type: 'date' as const, required: true },
        { key: 'endDate', header: '结束日期', type: 'date' as const },
        { key: 'status', header: '状态', type: 'select' as const, 
          options: [
            { value: 'ACTIVE', label: '进行中' },
            { value: 'COMPLETED', label: '已完成' },
            { value: 'PAUSED', label: '暂停' }
          ]
        }
      ]
    }]
  },
  
  // Achievement import template
  achievements: {
    name: '成果导入模板',
    nameEn: 'Achievement Import Template',
    description: '用于批量导入学生成果数据',
    sheets: [{
      name: '成果数据',
      columns: [
        { key: 'studentEmail', header: '学生邮箱', type: 'text' as const, required: true },
        { key: 'type', header: '成果类型', type: 'select' as const, required: true,
          options: [
            { value: 'PAPER', label: '论文' },
            { value: 'PATENT', label: '专利' },
            { value: 'SOFTWARE_COPYRIGHT', label: '软件著作权' },
            { value: 'COMPETITION', label: '竞赛' },
            { value: 'OTHER', label: '其他' }
          ]
        },
        { key: 'title', header: '成果标题', type: 'text' as const, required: true },
        { key: 'description', header: '成果描述', type: 'text' as const },
        { key: 'proof', header: '证明材料链接', type: 'text' as const },
        { key: 'score', header: '分数', type: 'number' as const },
        { key: 'verified', header: '是否验证', type: 'boolean' as const }
      ]
    }]
  },
  
  // Topic import template
  topics: {
    name: '题目导入模板',
    nameEn: 'Topic Import Template',
    description: '用于批量导入研究题目',
    sheets: [{
      name: '题目数据',
      columns: [
        { key: 'title', header: '题目标题', type: 'text' as const, required: true },
        { key: 'titleEn', header: '英文标题', type: 'text' as const },
        { key: 'description', header: '题目描述', type: 'text' as const, required: true },
        { key: 'professorEmail', header: '教授邮箱', type: 'text' as const, required: true },
        { key: 'field', header: '研究领域', type: 'text' as const, required: true },
        { key: 'difficulty', header: '难度', type: 'select' as const, required: true,
          options: [
            { value: 'BEGINNER', label: '初级' },
            { value: 'INTERMEDIATE', label: '中级' },
            { value: 'ADVANCED', label: '高级' }
          ]
        },
        { key: 'maxStudents', header: '最大学生数', type: 'number' as const, required: true },
        { key: 'prerequisites', header: '先决条件', type: 'array' as const },
        { key: 'expectedOutcomes', header: '期望成果', type: 'array' as const },
        { key: 'type', header: '项目类型', type: 'select' as const, required: true,
          options: [
            { value: 'INNOVATION', label: '创新项目' },
            { value: 'ENTERPRISE', label: '企业项目' }
          ]
        }
      ]
    }]
  },
  
  // Mentor application template
  mentorApplications: {
    name: '导师申请导入模板',
    nameEn: 'Mentor Application Import Template',
    description: '用于批量导入导师申请数据',
    sheets: [{
      name: '导师申请数据',
      columns: [
        { key: 'studentEmail', header: '学生邮箱', type: 'text' as const, required: true },
        { key: 'academicYear', header: '学年', type: 'text' as const, required: true },
        { key: 'firstChoiceEmail', header: '第一志愿导师邮箱', type: 'text' as const, required: true },
        { key: 'firstReason', header: '第一志愿理由', type: 'text' as const, required: true },
        { key: 'secondChoiceEmail', header: '第二志愿导师邮箱', type: 'text' as const, required: true },
        { key: 'secondReason', header: '第二志愿理由', type: 'text' as const, required: true },
        { key: 'thirdChoiceEmail', header: '第三志愿导师邮箱', type: 'text' as const },
        { key: 'thirdReason', header: '第三志愿理由', type: 'text' as const },
        { key: 'personalStatement', header: '个人陈述', type: 'text' as const, required: true },
        { key: 'researchInterest', header: '研究兴趣', type: 'text' as const, required: true }
      ]
    }]
  },
  
  // Lab import template
  labs: {
    name: '实验室导入模板',
    nameEn: 'Lab Import Template',
    description: '用于批量导入实验室数据',
    sheets: [{
      name: '实验室数据',
      columns: [
        { key: 'name', header: '实验室名称', type: 'text' as const, required: true },
        { key: 'nameEn', header: '英文名称', type: 'text' as const },
        { key: 'code', header: '实验室编号', type: 'text' as const, required: true },
        { key: 'description', header: '实验室描述', type: 'text' as const },
        { key: 'directorEmail', header: '负责人邮箱', type: 'text' as const, required: true },
        { key: 'capacity', header: '容量', type: 'number' as const, required: true },
        { key: 'location', header: '位置', type: 'text' as const },
        { key: 'researchAreas', header: '研究方向', type: 'array' as const },
        { key: 'equipment', header: '设备清单', type: 'array' as const },
        { key: 'website', header: '网站', type: 'text' as const }
      ]
    }]
  }
}

// Helper function to get template by name
export function getExcelTemplate(name: string): ExcelTemplate | null {
  return excelTemplates[name as keyof typeof excelTemplates] || null
}