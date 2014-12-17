/**
 * Part of the Filesender software.
 * See http://filesender.org
 */

var terasender_worker = {
    /**
     * Worker properties
     */
    id: null, // Worker id
    
    job: { // Current job
        file: null, // File data (id, key, size, blob)
        chunk: null, // Chunk coordinates (start, end)
    },
    
    /**
     * Start the worker
     */
    start: function() {
        this.requestJob();
    },
    
    /**
     * Request job from driver
     */
    requestJob: function() {
        this.log('Requesting job');
        this.sendCommand('requestJob');
    },
    
    /**
     * Execute a given job
     * 
     * @param object job job to execute
     */
    executeJob: function(job) {
        if('file' in job) { // Switch files
            this.job.file = job.file;
        }
        
        this.job.chunk = job.chunk;
        
        if(!this.job.file) {
            this.error({message: 'file_missing'});
            return;
        }
        
        var file = this.job.file;
        
        this.log('Starting job file:' + file.id + '[' + job.chunk.start + '...' + job.chunk.end + ']');
        
        var slicer = file.blob.slice ? 'slice' : (file.blob.mozSlice ? 'mozSlice' : (file.blob.webkitSlice ? 'webkitSlice' : 'slice'));
        
        var blob = file.blob[slicer](job.chunk.start, job.chunk.end);
        
        var xhr = this.createXhr();
        
        xhr.onreadystatechange = function() {
            terasender_worker.uploadRequestChange(xhr);
        };
        
        var url = file.endpoint.replace('{offset}', job.chunk.start);
        xhr.open('PUT', url, true); // Open a request to the upload endpoint
        
        xhr.setRequestHeader('Content-Disposition', 'attachment; name="chunk"'); 
        xhr.setRequestHeader('Content-Type', 'application/octet-stream');
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('X-Filesender-File-Size', file.size);
        xhr.setRequestHeader('X-Filesender-Chunk-Offset', job.chunk.start);
        xhr.setRequestHeader('X-Filesender-Chunk-Size', blob.size);
        
        try {
            xhr.send(blob);
        } catch(err) {
            this.error({message: 'source_file_not_available', details: {job: this.job}});
        }
    },
    
    /**
     * Xhr factory
     */
    createXhr: function() {
        try { return new XMLHttpRequest(); } catch(e) {}
        try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {}
        return null;
    },
    
    /**
     * Report that current job is complete
     */
    reportDone: function() {
        this.log('Executed job file:' + this.job.file.id + '[' + this.job.chunk.start + '...' + this.job.chunk.end + ']');
        this.sendCommand('jobExecuted', this.job);
    },
    
    /**
     * Upload xhr onreadystatechange callback
     * 
     * @param object xhr
     */
    uploadRequestChange: function(xhr){
        if(xhr.readyState != 4) return; // Not a progress update
        
        if(xhr.status == 200) { // All went well
            this.reportDone();
        }else if(xhr.status == 0) { // Request cancelled (browser refresh or such)
            this.log('broken, exiting');
            close();
        }else{ // We have an error
            var msg = xhr.responseText.replace(/^\s+/, '').replace(/\s+$/, '');
            
            try {
                var error = JSON.parse(msg);
                if(!error.details) error.details = {};
                error.details.job = this.job;
                this.error(error);
            } catch(e) {
                this.error({message: msg, details: {job: this.job}});
            }
        }
    },
    
    /**
     * Log to driver
     * 
     * @param string message
     */
    log: function(message) {
        this.sendCommand('log', message);
    },
    
    /**
     * Report error to driver
     * 
     * @param string code error code
     * @param string details
     */
    error: function(error) {
        this.sendCommand('error', error);
    },
    
    /**
     * Post message to driver
     * 
     * @param string command
     * @param object data
     */
    sendCommand: function(command, data) {
        postMessage({
            command: command,
            worker_id: this.id,
            data: data
        });
    },
    
    /**
     * Handle messages from driver
     * 
     * @param object message
     */
    onMessage: function(message) {
        var command = message.command;
        var data = message.data;
        
        if(!command) return;
        
        switch(command) {
            case 'start' :
                this.id = data;
                this.requestJob();
                break;
            
            case 'executeJob' :
                this.executeJob(data);
                break;
            
            case 'comeBackLater' :
                var worker = this;
                setTimeout(function() {
                    worker.requestJob();
                }, 500);
                break;
            
            case 'done' :
                this.log('closing');
                close();
                break;
        }
    },
};

/**
 * Register message handler
 */
self.addEventListener('message' , function(e) {
    terasender_worker.onMessage(e.data);
});