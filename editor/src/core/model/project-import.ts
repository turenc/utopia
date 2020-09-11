import * as JSZip from 'jszip'
import { JSZipObject } from 'jszip'
import { isText } from 'istextorbinary'
import { ProjectContents, RevisionsState } from '../shared/project-file-types'
import {
  assetFile,
  codeFile,
  directory,
  fileTypeFromFileName,
  imageFile,
  uiJsFile,
} from './project-file-utils'
import { lintAndParse } from '../workers/parser-printer/parser-printer'
import { assetResultForBase64, getFileExtension, imageResultForBase64 } from '../shared/file-utils'
import { Size } from '../shared/math-utils'
import { left } from '../shared/either'
import { parseFailure } from '../workers/common/project-file-utils'

async function attemptedTextFileLoad(fileName: string, file: JSZipObject): Promise<string | null> {
  const fileBuffer = await file.async('nodebuffer')
  if (isText(fileName, fileBuffer)) {
    return file.async('string')
  } else {
    return null
  }
}

export interface UnsavedAsset {
  fileName: string
  fileType: string
  base64: string
  hash: string
  size: Size | null
}

export interface ProjectImportResult {
  projectName: string
  contents: ProjectContents
  assetsToUpload: Array<UnsavedAsset>
}

export async function importZippedGitProject(
  projectName: string,
  zipped: JSZip,
): Promise<ProjectImportResult> {
  let loadedProject: ProjectContents = {}
  let promises: Array<Promise<void>> = []
  let assetsToUpload: Array<UnsavedAsset> = []

  const loadFile = async (fileName: string, file: JSZip.JSZipObject) => {
    const shiftedFileName = fileName.replace(/[^\/]*\//, '/') // Github uses the project name and a commit hash as the root directory
    if (shiftedFileName.trim() === '/') {
      // We don't need to create a root directory
      return
    }
    if (file.dir) {
      loadedProject[shiftedFileName] = directory()
    } else {
      const expectedFileType = fileTypeFromFileName(shiftedFileName)
      switch (expectedFileType) {
        case 'ASSET_FILE': {
          const fileType = getFileExtension(shiftedFileName)
          const base64 = await file.async('base64')
          const assetResult = assetResultForBase64(shiftedFileName, base64)
          assetsToUpload.push({
            fileName: assetResult.filename,
            fileType: fileType,
            base64: assetResult.dataUrl,
            hash: assetResult.hash,
            size: null,
          })
          loadedProject[shiftedFileName] = assetFile()
          break
        }
        case 'IMAGE_FILE': {
          const fileType = getFileExtension(shiftedFileName)
          const base64 = await file.async('base64')
          const imageResult = await imageResultForBase64(shiftedFileName, fileType, base64)
          assetsToUpload.push({
            fileName: imageResult.filename,
            fileType: fileType,
            base64: imageResult.dataUrl,
            hash: imageResult.hash,
            size: imageResult.size,
          })
          loadedProject[shiftedFileName] = imageFile(
            undefined,
            undefined,
            undefined,
            undefined,
            imageResult.hash,
          )
          break
        }
        case 'UI_JS_FILE':
        case 'CODE_FILE':
          const loadedFile = await attemptedTextFileLoad(shiftedFileName, file)
          if (loadedFile == null) {
            // FIXME Client should show an error if loading a text file fails
            console.error(`Failed to parse file ${shiftedFileName} as a text file`)
          } else {
            if (expectedFileType === 'UI_JS_FILE') {
              // TODO We really need a way to represent unparsed files, or a way to separate the parsed file from the contents
              loadedProject[shiftedFileName] = uiJsFile(
                left(parseFailure(null, null, null, [], loadedFile)),
                null,
                RevisionsState.BothMatch,
                Date.now(),
              )
            } else {
              loadedProject[shiftedFileName] = codeFile(loadedFile, null)
            }
          }
          break
        default:
          const _exhaustiveCheck: never = expectedFileType
          throw new Error(`Unknown file type ${expectedFileType}`)
      }
    }
  }

  zipped.forEach((fileName, file) => {
    promises.push(loadFile(fileName, file))
  })

  await Promise.all(promises)

  return {
    projectName: projectName,
    contents: loadedProject,
    assetsToUpload: assetsToUpload,
  }
}