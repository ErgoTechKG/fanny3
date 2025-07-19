import type { FormSubmission } from '@prisma/client'
import { z, type ZodType } from 'zod'

export interface FormField {
  id: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'radio' | 'checkbox' | 'file' | 'array' | 'object'
  label: string
  labelEn?: string
  description?: string
  required: boolean
  placeholder?: string
  defaultValue?: unknown
  validation?: {
    min?: number
    max?: number
    minLength?: number
    maxLength?: number
    pattern?: string
    options?: Array<{ value: string; label: string; labelEn?: string }>
    fileTypes?: string[]
    maxFileSize?: number // in bytes
  }
  conditional?: {
    field: string
    operator: 'equals' | 'notEquals' | 'contains' | 'in'
    value: unknown
  }
  // For array fields
  arrayFields?: FormField[]
  // For object fields
  objectFields?: FormField[]
}

export interface FormSection {
  id: string
  title: string
  titleEn?: string
  description?: string
  fields: FormField[]
  order: number
}

export interface FormSchema {
  id: string
  type: string
  version: number
  title: string
  titleEn?: string
  description?: string
  sections: FormSection[]
  submitButton?: {
    text: string
    textEn?: string
  }
  workflow?: {
    requiresApproval: boolean
    approvers?: string[] // Role names or user IDs
    notifications?: {
      onSubmit?: string[]
      onApprove?: string[]
      onReject?: string[]
    }
  }
}

export class FormEngine {
  /**
   * Generate Zod schema from form fields
   */
  generateZodSchema(fields: FormField[]): ZodType<Record<string, unknown>> {
    const schema: Record<string, ZodType<unknown>> = {}
    
    for (const field of fields) {
      let fieldSchema: ZodType<unknown>
      
      switch (field.type) {
        case 'text':
          fieldSchema = z.string()
          if (field.validation?.minLength) {
            fieldSchema = (fieldSchema as z.ZodString).min(field.validation.minLength)
          }
          if (field.validation?.maxLength) {
            fieldSchema = (fieldSchema as z.ZodString).max(field.validation.maxLength)
          }
          if (field.validation?.pattern) {
            fieldSchema = (fieldSchema as z.ZodString).regex(new RegExp(field.validation.pattern))
          }
          break
          
        case 'textarea':
          fieldSchema = z.string()
          if (field.validation?.minLength) {
            fieldSchema = (fieldSchema as z.ZodString).min(field.validation.minLength)
          }
          if (field.validation?.maxLength) {
            fieldSchema = (fieldSchema as z.ZodString).max(field.validation.maxLength)
          }
          break
          
        case 'number':
          fieldSchema = z.number()
          if (field.validation?.min !== undefined) {
            fieldSchema = (fieldSchema as z.ZodNumber).min(field.validation.min)
          }
          if (field.validation?.max !== undefined) {
            fieldSchema = (fieldSchema as z.ZodNumber).max(field.validation.max)
          }
          break
          
        case 'date':
          fieldSchema = z.string().datetime()
          break
          
        case 'select':
        case 'radio':
          if (field.validation?.options) {
            const values = field.validation.options.map(opt => opt.value) as [string, ...string[]]
            fieldSchema = z.enum(values)
          } else {
            fieldSchema = z.string()
          }
          break
          
        case 'checkbox':
          fieldSchema = z.boolean()
          break
          
        case 'file':
          fieldSchema = z.object({
            url: z.string().url(),
            name: z.string(),
            size: z.number(),
            type: z.string()
          })
          break
          
        case 'array':
          if (field.arrayFields) {
            const itemSchema = this.generateZodSchema(field.arrayFields)
            fieldSchema = z.array(itemSchema)
          } else {
            fieldSchema = z.array(z.unknown())
          }
          break
          
        case 'object':
          if (field.objectFields) {
            fieldSchema = this.generateZodSchema(field.objectFields)
          } else {
            fieldSchema = z.object({})
          }
          break
          
        default:
          fieldSchema = z.unknown()
      }
      
      // Apply required/optional
      if (!field.required) {
        fieldSchema = fieldSchema.optional()
      }
      
      // Apply default value
      if (field.defaultValue !== undefined) {
        fieldSchema = fieldSchema.default(field.defaultValue)
      }
      
      schema[field.id] = fieldSchema
    }
    
    return z.object(schema)
  }
  
  /**
   * Validate form data against schema
   */
  validateFormData(formSchema: FormSchema, data: Record<string, unknown>): {
    valid: boolean
    errors?: Record<string, string>
  } {
    const allFields = formSchema.sections.flatMap(section => section.fields)
    const zodSchema = this.generateZodSchema(allFields)
    
    try {
      // Apply conditional field logic
      const processedData = this.applyConditionalLogic(allFields, data)
      
      zodSchema.parse(processedData)
      return { valid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {}
        for (const issue of error.issues) {
          const path = issue.path.join('.')
          errors[path] = issue.message
        }
        return { valid: false, errors }
      }
      return { valid: false, errors: { _error: 'Validation failed' } }
    }
  }
  
  /**
   * Apply conditional field logic
   */
  private applyConditionalLogic(
    fields: FormField[],
    data: Record<string, unknown>
  ): Record<string, unknown> {
    const result = { ...data }
    
    for (const field of fields) {
      if (field.conditional) {
        const conditionMet = this.evaluateCondition(
          data[field.conditional.field],
          field.conditional.operator,
          field.conditional.value
        )
        
        if (!conditionMet) {
          // Remove field from data if condition not met
          delete result[field.id]
        }
      }
    }
    
    return result
  }
  
  /**
   * Evaluate conditional logic
   */
  private evaluateCondition(
    fieldValue: unknown,
    operator: string,
    conditionValue: unknown
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue
      case 'notEquals':
        return fieldValue !== conditionValue
      case 'contains':
        return String(fieldValue).includes(String(conditionValue))
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue)
      default:
        return true
    }
  }
  
  /**
   * Generate form HTML (for preview/export)
   */
  generateFormHTML(formSchema: FormSchema, lang: 'zh' | 'en' = 'zh'): string {
    let html = `<form id="${formSchema.id}" class="dynamic-form">\n`
    html += `  <h2>${lang === 'zh' ? formSchema.title : formSchema.titleEn || formSchema.title}</h2>\n`
    
    if (formSchema.description) {
      html += `  <p class="form-description">${formSchema.description}</p>\n`
    }
    
    for (const section of formSchema.sections) {
      html += `  <section class="form-section">\n`
      html += `    <h3>${lang === 'zh' ? section.title : section.titleEn || section.title}</h3>\n`
      
      if (section.description) {
        html += `    <p>${section.description}</p>\n`
      }
      
      for (const field of section.fields) {
        html += this.generateFieldHTML(field, lang)
      }
      
      html += `  </section>\n`
    }
    
    const buttonText = lang === 'zh' 
      ? formSchema.submitButton?.text || '提交' 
      : formSchema.submitButton?.textEn || 'Submit'
    
    html += `  <button type="submit">${buttonText}</button>\n`
    html += `</form>`
    
    return html
  }
  
  /**
   * Generate HTML for a single field
   */
  private generateFieldHTML(field: FormField, lang: 'zh' | 'en'): string {
    const label = lang === 'zh' ? field.label : field.labelEn || field.label
    const required = field.required ? ' required' : ''
    let html = `    <div class="form-field">\n`
    html += `      <label for="${field.id}">${label}${field.required ? ' *' : ''}</label>\n`
    
    switch (field.type) {
      case 'text':
        html += `      <input type="text" id="${field.id}" name="${field.id}"${required}>\n`
        break
        
      case 'textarea':
        html += `      <textarea id="${field.id}" name="${field.id}"${required}></textarea>\n`
        break
        
      case 'number':
        html += `      <input type="number" id="${field.id}" name="${field.id}"${required}>\n`
        break
        
      case 'date':
        html += `      <input type="date" id="${field.id}" name="${field.id}"${required}>\n`
        break
        
      case 'select':
        html += `      <select id="${field.id}" name="${field.id}"${required}>\n`
        if (field.validation?.options) {
          for (const option of field.validation.options) {
            const optionLabel = lang === 'zh' ? option.label : option.labelEn || option.label
            html += `        <option value="${option.value}">${optionLabel}</option>\n`
          }
        }
        html += `      </select>\n`
        break
        
      case 'checkbox':
        html += `      <input type="checkbox" id="${field.id}" name="${field.id}">\n`
        break
        
      case 'file':
        html += `      <input type="file" id="${field.id}" name="${field.id}"${required}>\n`
        break
    }
    
    if (field.description) {
      html += `      <small>${field.description}</small>\n`
    }
    
    html += `    </div>\n`
    return html
  }
  
  /**
   * Export form data to various formats
   */
  exportFormData(
    submissions: FormSubmission[],
    format: 'json' | 'csv' | 'excel'
  ): unknown {
    switch (format) {
      case 'json':
        return submissions.map(s => ({
          id: s.id,
          formType: s.formType,
          submittedAt: s.createdAt,
          status: s.status,
          data: s.data
        }))
        
      case 'csv': {
        // Extract all unique fields from submissions
        const allFields = new Set<string>()
        for (const submission of submissions) {
          const data = submission.data as Record<string, unknown>
          Object.keys(data).forEach(key => allFields.add(key))
        }
        
        const headers = ['ID', 'Form Type', 'Status', 'Submitted At', ...Array.from(allFields)]
        const rows = submissions.map(s => {
          const data = s.data as Record<string, unknown>
          const row = [s.id, s.formType, s.status, s.createdAt.toISOString()]
          
          for (const field of allFields) {
            row.push(data[field] || '')
          }
          
          return row
        })
        
        return { headers, rows }
      }
        
      case 'excel':
        // Similar to CSV but structured for Excel export
        return this.exportFormData(submissions, 'csv')
        
      default:
        return submissions
    }
  }
  
  /**
   * Calculate form completion progress
   */
  calculateProgress(formSchema: FormSchema, data: Record<string, unknown>): number {
    const allFields = formSchema.sections.flatMap(section => section.fields)
    const requiredFields = allFields.filter(field => field.required)
    
    if (requiredFields.length === 0) return 100
    
    let completed = 0
    for (const field of requiredFields) {
      if (data[field.id] !== undefined && data[field.id] !== null && data[field.id] !== '') {
        completed++
      }
    }
    
    return Math.round((completed / requiredFields.length) * 100)
  }
  
  /**
   * Clone a form template with modifications
   */
  cloneFormTemplate(
    template: FormSchema,
    modifications: Partial<FormSchema>
  ): FormSchema {
    return {
      ...template,
      ...modifications,
      id: modifications.id || `${template.id}-clone-${Date.now()}`,
      sections: modifications.sections || template.sections.map(section => ({
        ...section,
        fields: section.fields.map(field => ({ ...field }))
      }))
    }
  }
}

// Form template factory for common form types
export class FormTemplateFactory {
  static createBlankTemplate(type: string, title: string): FormSchema {
    return {
      id: `form-${type}-${Date.now()}`,
      type,
      version: 1,
      title,
      sections: [],
      workflow: {
        requiresApproval: false
      }
    }
  }
  
  static addSection(
    template: FormSchema,
    section: Omit<FormSection, 'order'>
  ): FormSchema {
    const order = template.sections.length
    return {
      ...template,
      sections: [...template.sections, { ...section, order }]
    }
  }
  
  static addField(
    template: FormSchema,
    sectionId: string,
    field: FormField
  ): FormSchema {
    return {
      ...template,
      sections: template.sections.map(section => 
        section.id === sectionId
          ? { ...section, fields: [...section.fields, field] }
          : section
      )
    }
  }
}