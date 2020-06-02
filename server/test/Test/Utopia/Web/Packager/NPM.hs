{-# LANGUAGE OverloadedStrings #-}

module Test.Utopia.Web.Packager.NPM where

import           Protolude
import           System.Directory
import           System.FilePath
import           Test.Hspec
import           Utopia.Web.Packager.NPM

getNodeModulesSubDirectories :: FilePath -> IO [FilePath]
getNodeModulesSubDirectories projectFolder = do
  paths <- listDirectory (projectFolder </> "node_modules")
  return $ sort paths

npmSpec :: Spec
npmSpec = do
  describe "withInstalledProject" $ do
    it "should have the various dependencies in node_modules for react" $ do
      result <- withInstalledProject "react" "16.13.1" getNodeModulesSubDirectories
      result `shouldBe` [".bin", "js-tokens", "loose-envify", "object-assign", "prop-types", "react", "react-is"]
    it "should fail for a non-existent project" $ do
      withInstalledProject "non-existent-project-that-will-never-exist" "9.9.9.9.9.9" getNodeModulesSubDirectories `shouldThrow` anyIOException
  describe "getRelevantFiles" $ do
    it "should get a bunch of .js and package.json files" $ do
      result <- withInstalledProject "react" "16.13.1" getRelevantFiles
      let sortedFilenames = sort $ fmap fst result
      sortedFilenames `shouldBe` [
        "/node_modules/js-tokens/index.js",
        "/node_modules/js-tokens/package.json",
        "/node_modules/loose-envify/cli.js",
        "/node_modules/loose-envify/custom.js",
        "/node_modules/loose-envify/index.js",
        "/node_modules/loose-envify/loose-envify.js",
        "/node_modules/loose-envify/package.json",
        "/node_modules/loose-envify/replace.js",
        "/node_modules/object-assign/index.js",
        "/node_modules/object-assign/package.json",
        "/node_modules/prop-types/checkPropTypes.js",
        "/node_modules/prop-types/factory.js",
        "/node_modules/prop-types/factoryWithThrowingShims.js",
        "/node_modules/prop-types/factoryWithTypeCheckers.js",
        "/node_modules/prop-types/index.js",
        "/node_modules/prop-types/lib/ReactPropTypesSecret.js",
        "/node_modules/prop-types/package.json",
        "/node_modules/prop-types/prop-types.js",
        "/node_modules/prop-types/prop-types.min.js",
        "/node_modules/react-is/cjs/react-is.development.js",
        "/node_modules/react-is/cjs/react-is.production.min.js",
        "/node_modules/react-is/index.js",
        "/node_modules/react-is/package.json",
        "/node_modules/react-is/umd/react-is.development.js",
        "/node_modules/react-is/umd/react-is.production.min.js",
        "/node_modules/react/cjs/react.development.js",
        "/node_modules/react/cjs/react.production.min.js",
        "/node_modules/react/index.js",
        "/node_modules/react/package.json",
        "/node_modules/react/umd/react.development.js",
        "/node_modules/react/umd/react.production.min.js",
        "/node_modules/react/umd/react.profiling.min.js" ]
