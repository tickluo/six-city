<template>
  <input type="file" @change="onChange" :multiple="multiple"/>
</template>


<script>
  export default {
    props: {
      // Support Multiple File?
      multiple: {
        type: Boolean,
        default: false
      },
      // Pass the files info when it's done
      done: {
        type: Function,
        default: () => {
        }
      }
    },
    methods: {
      onChange(e){
        // get the files
        let files = e.target.files
        // Process each file
        var allFiles = []
        for (var i = 0; i < files.length; i++) {
          let file = files[i]
          // Make new FileReader
          let reader = new FileReader()
          // Convert the file to base64 text
          reader.readAsDataURL(file)
          // on reader load somthing...
          reader.onload = () => {
            // Make a fileInfo Object
            let fileInfo = {
              name: file.name,
              type: file.type,
              size: Math.round(file.size / 1000) + ' kB',
              base64: reader.result,
              file: file
            }
            // Push it to the state
            allFiles.push(fileInfo)
            // If all files have been proceed
            if (allFiles.length == files.length) {
              // Apply Callback function
              if (this.multiple) this.done(allFiles)
              else this.done(allFiles[0])
            }
          } // reader.onload
        } // for
      }, // onChange()
    }
  }
</script>
